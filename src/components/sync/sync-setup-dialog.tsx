import { useState, useCallback, useEffect } from "react";
import {
  Copy,
  Check,
  Cloud,
  CloudOff,
  Loader2,
  Trash2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { generatePassphrase } from "@/core/crypto/passphrase-generator";
import { useSyncStore } from "@/stores/sync-store";
import { useFeedStore } from "@/stores/feed-store";
import { useAppStore } from "@/stores/app-store";
import { checkVaultExists, pullVault } from "@/core/sync/sync-service";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type SetupStep = "passphrase" | "confirm" | "syncing" | "done";
type ExistingStep =
  | "passphrase"
  | "checking"
  | "merge-options"
  | "syncing"
  | "done"
  | "error";
type MergeMode = "replace" | "merge";
type DialogView =
  | "status"
  | "setup"
  | "existing"
  | "confirm-delete"
  | "confirm-disable"
  | "confirm-logout";

interface ConfirmationViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "destructive";
  confirmIcon?: React.ReactNode;
}

function ConfirmationView({
  open,
  onOpenChange,
  icon,
  title,
  description,
  confirmLabel,
  loadingLabel,
  isLoading,
  onConfirm,
  onCancel,
  variant = "default",
  confirmIcon,
}: ConfirmationViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center py-2">{icon}</div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                {confirmIcon}
                {confirmLabel}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SyncSetupDialog() {
  const status = useSyncStore((s) => s.status);
  const syncError = useSyncStore((s) => s.error);
  const enableSync = useSyncStore((s) => s.enableSync);
  const disableSync = useSyncStore((s) => s.disableSync);
  const logout = useSyncStore((s) => s.logout);
  const switchToExistingCloud = useSyncStore((s) => s.switchToExistingCloud);
  const resetApp = useAppStore((s) => s.resetApp);
  const localFeedCount = useFeedStore((s) => s.feeds.length);
  const open = useSyncStore((s) => s.dialogOpen);
  const onOpenChange = useSyncStore((s) => s.setDialogOpen);

  const [view, setView] = useState<DialogView>("status");
  const [setupStep, setSetupStep] = useState<SetupStep>("passphrase");
  const [passphrase, setPassphrase] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Existing cloud flow state
  const [existingStep, setExistingStep] = useState<ExistingStep>("passphrase");
  const [existingPassphrase, setExistingPassphrase] = useState("");
  const [existingError, setExistingError] = useState<string | null>(null);
  const [cloudFeedCount, setCloudFeedCount] = useState(0);
  const [mergeMode, setMergeMode] = useState<MergeMode>("replace");

  // Reset all internal state when dialog closes
  useEffect(() => {
    if (!open) {
      setView("status");
      setSetupStep("passphrase");
      setPassphrase("");
      setSaved(false);
      setCopied(false);
      setIsDeleting(false);
      setIsDisabling(false);
      setIsLoggingOut(false);
      setConfirmInput("");
      setConfirmError(null);
      // Existing cloud flow state
      setExistingStep("passphrase");
      setExistingPassphrase("");
      setExistingError(null);
      setCloudFeedCount(0);
      setMergeMode("replace");
    }
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function handleStartSetup() {
    setPassphrase(generatePassphrase());
    setSetupStep("passphrase");
    setView("setup");
  }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [passphrase]);

  async function handleEnable() {
    setSetupStep("syncing");
    await enableSync(passphrase);
    setSetupStep("done");
  }

  async function handleDisableSync() {
    setIsDisabling(true);
    await disableSync();
    setIsDisabling(false);
    toast("Sync disabled. Server data deleted.");
    handleOpenChange(false);
  }

  async function handleDeleteAll() {
    setIsDeleting(true);
    await resetApp();
    await disableSync();
    handleOpenChange(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    handleOpenChange(false);
  }

  function handleStartExisting() {
    setExistingStep("passphrase");
    setExistingPassphrase("");
    setExistingError(null);
    setView("existing");
  }

  async function handleCheckExistingPassphrase() {
    setExistingStep("checking");
    setExistingError(null);

    const existsResult = await checkVaultExists(existingPassphrase);
    if (!existsResult.ok) {
      setExistingError(existsResult.error);
      setExistingStep("error");
      return;
    }

    if (!existsResult.value) {
      setExistingError(
        "No cloud data found for this passphrase. Check that you entered it correctly.",
      );
      setExistingStep("error");
      return;
    }

    // Vault exists, get feed count for merge options UI
    const pullResult = await pullVault(existingPassphrase);
    if (!pullResult.ok) {
      setExistingError(pullResult.error);
      setExistingStep("error");
      return;
    }

    setCloudFeedCount(pullResult.value.feeds.length);
    setExistingStep("merge-options");
  }

  async function handleExistingCloudSwitch() {
    setExistingStep("syncing");

    const result = await switchToExistingCloud(existingPassphrase, mergeMode);
    if (!result.ok) {
      setExistingError(result.error);
      setExistingStep("error");
      return;
    }

    setExistingStep("done");
    toast.success("Connected to cloud account");
  }

  const getStatusDescription = () => {
    switch (status) {
      case "local-only":
        return "Your data is stored locally in this browser only.";
      case "synced":
        return "Your data is encrypted and synced across devices.";
      case "syncing":
        return "Sync is in progress...";
      case "error":
        return syncError
          ? `Sync error: ${syncError}`
          : "There was a sync error. Please try again.";
    }
  };

  // --- Setup wizard views ---
  if (view === "setup") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={setupStep !== "syncing"}>
          {setupStep === "passphrase" && (
            <>
              <DialogHeader>
                <DialogTitle>Your secret key</DialogTitle>
                <DialogDescription>
                  This key is the only way to access your synced data. Save it
                  somewhere safe — it cannot be recovered.
                </DialogDescription>
              </DialogHeader>

              <div className="relative rounded-md border bg-muted p-4">
                <p className="text-center font-mono text-lg tracking-wide select-all">
                  {passphrase}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 size-7"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={saved}
                  onCheckedChange={(v) => setSaved(v === true)}
                />
                I&apos;ve saved my secret key
              </label>

              <DialogFooter>
                <Button
                  onClick={() => setSetupStep("confirm")}
                  disabled={!saved}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {setupStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm your secret key</DialogTitle>
                <DialogDescription>
                  Enter your secret key to confirm you've saved it correctly.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const normalized = confirmInput.toLowerCase().trim();
                  const expected = passphrase.toLowerCase().trim();
                  if (normalized === expected) {
                    setConfirmError(null);
                    handleEnable();
                  } else {
                    setConfirmError("That doesn't match. Try again.");
                  }
                }}
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter your secret key"
                    value={confirmInput}
                    onChange={(e) => {
                      setConfirmInput(e.target.value);
                      setConfirmError(null);
                    }}
                    autoComplete="off"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {confirmError && (
                    <p className="text-sm text-destructive">{confirmError}</p>
                  )}
                </div>

                <DialogFooter className="mt-4 flex-row gap-2 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSetupStep("passphrase")}
                  >
                    Back
                  </Button>
                  <Button type="submit">Enable sync</Button>
                </DialogFooter>
              </form>
            </>
          )}

          {setupStep === "syncing" && (
            <>
              <DialogHeader>
                <DialogTitle>Setting up sync</DialogTitle>
                <DialogDescription>
                  Encrypting and syncing your data...
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {setupStep === "done" && (
            <>
              <DialogHeader>
                <DialogTitle>Sync is set up</DialogTitle>
                <DialogDescription>
                  Your data is now encrypted and synced. Enter your secret key
                  on any device to access your feeds.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="size-8 text-green-600" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // --- Existing cloud account flow ---
  if (view === "existing") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={
            existingStep !== "checking" && existingStep !== "syncing"
          }
        >
          {existingStep === "passphrase" && (
            <>
              <DialogHeader>
                <DialogTitle>Use existing cloud account</DialogTitle>
                <DialogDescription>
                  Enter your passphrase to connect to an existing cloud account.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (existingPassphrase.trim()) {
                    handleCheckExistingPassphrase();
                  }
                }}
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter your passphrase"
                    value={existingPassphrase}
                    onChange={(e) => setExistingPassphrase(e.target.value)}
                    autoComplete="off"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <DialogFooter className="mt-4 flex-row gap-2 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView("status")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!existingPassphrase.trim()}>
                    Connect
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {existingStep === "checking" && (
            <>
              <DialogHeader>
                <DialogTitle>Checking passphrase</DialogTitle>
                <DialogDescription>
                  Looking for your cloud account...
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {existingStep === "merge-options" && (
            <>
              <DialogHeader>
                <DialogTitle>Cloud account found</DialogTitle>
                <DialogDescription>
                  Found {cloudFeedCount} feed{cloudFeedCount !== 1 ? "s" : ""}{" "}
                  in cloud.
                  {localFeedCount > 0 &&
                    ` You have ${localFeedCount} local feed${localFeedCount !== 1 ? "s" : ""}.`}
                </DialogDescription>
              </DialogHeader>

              <RadioGroup
                value={mergeMode}
                onValueChange={(v) => setMergeMode(v as MergeMode)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="replace" id="replace" />
                  <div className="space-y-1">
                    <Label htmlFor="replace" className="font-medium">
                      Replace local with cloud
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Your local feeds will be deleted.
                    </p>
                  </div>
                </div>
                {localFeedCount > 0 && (
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="merge" id="merge" />
                    <div className="space-y-1">
                      <Label htmlFor="merge" className="font-medium">
                        Merge feeds
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Keep both local and cloud feeds. Duplicates will be
                        skipped.
                      </p>
                    </div>
                  </div>
                )}
              </RadioGroup>

              <DialogFooter className="mt-4 flex-row gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("status")}
                >
                  Cancel
                </Button>
                <Button onClick={handleExistingCloudSwitch}>Continue</Button>
              </DialogFooter>
            </>
          )}

          {existingStep === "syncing" && (
            <>
              <DialogHeader>
                <DialogTitle>Switching to cloud</DialogTitle>
                <DialogDescription>
                  {mergeMode === "merge"
                    ? "Merging and syncing your feeds..."
                    : "Importing your cloud data..."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {existingStep === "done" && (
            <>
              <DialogHeader>
                <DialogTitle>Connected to cloud</DialogTitle>
                <DialogDescription>
                  Your feeds are now synced with your cloud account.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="size-8 text-green-600" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              </DialogFooter>
            </>
          )}

          {existingStep === "error" && (
            <>
              <DialogHeader>
                <DialogTitle>Could not connect</DialogTitle>
                <DialogDescription>{existingError}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-8 text-destructive" />
                </div>
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setView("status")}>
                  Cancel
                </Button>
                <Button onClick={() => setExistingStep("passphrase")}>
                  Try again
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // --- Confirmation views ---
  if (view === "confirm-delete") {
    return (
      <ConfirmationView
        open={open}
        onOpenChange={handleOpenChange}
        icon={
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
        }
        title="Delete all data?"
        description="This will permanently delete all your feeds and articles. This action cannot be undone."
        confirmLabel="Delete everything"
        loadingLabel="Deleting..."
        confirmIcon={<Trash2 className="mr-2 size-4" />}
        isLoading={isDeleting}
        onConfirm={handleDeleteAll}
        onCancel={() => setView("status")}
        variant="destructive"
      />
    );
  }

  if (view === "confirm-disable") {
    return (
      <ConfirmationView
        open={open}
        onOpenChange={handleOpenChange}
        icon={
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
            <CloudOff className="size-6 text-amber-600" />
          </div>
        }
        title="Switch to local only?"
        description="This will delete your encrypted data from the server. Your local data will be kept. This cannot be undone."
        confirmLabel="Disable sync"
        loadingLabel="Disabling sync..."
        isLoading={isDisabling}
        onConfirm={handleDisableSync}
        onCancel={() => setView("status")}
      />
    );
  }

  if (view === "confirm-logout") {
    return (
      <ConfirmationView
        open={open}
        onOpenChange={handleOpenChange}
        icon={
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <LogOut className="size-6 text-muted-foreground" />
          </div>
        }
        title="Log out of this device?"
        description="This will clear all local data from this browser. Your encrypted cloud backup is preserved — you will need your secret key to access your feeds again."
        confirmLabel="Log out"
        loadingLabel="Logging out..."
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setView("status")}
      />
    );
  }

  // --- Main status view ---
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Data & storage</DialogTitle>
          <DialogDescription>{getStatusDescription()}</DialogDescription>
        </DialogHeader>

        {/* Sync actions — enable or disable */}
        {status === "local-only" && (
          <div className="border-t pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleStartSetup}
            >
              <Cloud className="mr-2 size-4" />
              Enable sync
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleStartExisting}
            >
              <KeyRound className="mr-2 size-4" />
              Use existing cloud account
            </Button>
          </div>
        )}

        {(status === "synced" ||
          status === "syncing" ||
          status === "error") && (
          <div className="border-t pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setView("confirm-disable")}
              disabled={status === "syncing"}
            >
              <CloudOff className="mr-2 size-4" />
              Switch to local only
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setView("confirm-logout")}
              disabled={status === "syncing"}
            >
              <LogOut className="mr-2 size-4" />
              Log out of this device
            </Button>
          </div>
        )}

        {/* Danger zone */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-destructive mb-2">
            Danger zone
          </p>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setView("confirm-delete")}
          >
            <Trash2 className="mr-2 size-4" />
            Delete all data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
