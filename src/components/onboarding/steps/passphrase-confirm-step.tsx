import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function PassphraseConfirmStep() {
  const setStep = useOnboardingStore((s) => s.setStep);
  const confirmationInput = useOnboardingStore((s) => s.confirmationInput);
  const confirmationError = useOnboardingStore((s) => s.confirmationError);
  const setConfirmationInput = useOnboardingStore(
    (s) => s.setConfirmationInput,
  );
  const validateConfirmation = useOnboardingStore(
    (s) => s.validateConfirmation,
  );

  function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    if (validateConfirmation()) {
      setStep("initializing");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Your Secret Key</DialogTitle>
        <DialogDescription>
          Enter your secret key to confirm you've saved it correctly.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleConfirm}>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter your secret key"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            autoComplete="off"
          />
          {confirmationError && (
            <p className="text-sm text-destructive">{confirmationError}</p>
          )}
        </div>

        <DialogFooter className="mt-4 flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("passphrase-display")}
          >
            Back
          </Button>
          <Button type="submit">
            Confirm
            <Kbd className="ml-2">Enter</Kbd>
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
