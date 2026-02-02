import { useState, useCallback } from "react";
import { Copy, Check, Cloud, Loader2 } from "lucide-react";
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

type Step = "welcome" | "passphrase" | "syncing" | "done";

export function SyncSetupDialog() {
  const status = useSyncStore((s) => s.status);
  const enableSync = useSyncStore((s) => s.enableSync);
  const setSynced = useSyncStore((s) => s.setSynced);
  const open = useSyncStore((s) => s.dialogOpen);
  const onOpenChange = useSyncStore((s) => s.setDialogOpen);

  const [step, setStep] = useState<Step>("welcome");
  const [passphrase, setPassphrase] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setStep("welcome");
      setPassphrase("");
      setSaved(false);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  function handleGenerate() {
    setPassphrase(generatePassphrase());
    setStep("passphrase");
  }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [passphrase]);

  async function handleEnable() {
    setStep("syncing");
    enableSync(passphrase);
    // TODO: Phase 3 will wire this to actual sync (re-encrypt + push).
    // For now, simulate a short delay then mark as synced.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSynced(Date.now());
    setStep("done");
  }

  // If sync is already configured, show status info instead of setup
  if (status === "synced" || status === "syncing" || status === "error") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync status</DialogTitle>
            <DialogDescription>
              {status === "synced" && "Your data is encrypted and synced."}
              {status === "syncing" && "Sync is in progress..."}
              {status === "error" &&
                "There was a sync error. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={step !== "syncing"}>
        {step === "welcome" && (
          <>
            <DialogHeader>
              <DialogTitle>Set up sync</DialogTitle>
              <DialogDescription>
                Your feeds are stored locally in this browser. Enable sync to
                access them from any device — encrypted so only you can read
                them.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleGenerate}>Generate secret key</Button>
            </DialogFooter>
          </>
        )}

        {step === "passphrase" && (
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
              <Button onClick={handleEnable} disabled={!saved}>
                Enable sync
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "syncing" && (
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

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>Sync is set up</DialogTitle>
              <DialogDescription>
                Your data is now encrypted and synced. Enter your secret key on
                any device to access your feeds.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Cloud className="size-10 text-primary" />
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
