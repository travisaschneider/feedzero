import { Smartphone, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function StorageChoiceStep() {
  const chooseStorageMode = useOnboardingStore((s) => s.chooseStorageMode);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Where should we store your data?</DialogTitle>
        <DialogDescription className="flex items-start gap-2 text-amber-600">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Your data lives in this browser. Clearing browser data or cookies
            will delete your feeds permanently.
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="h-auto flex-col items-start gap-2 p-5 text-left"
          onClick={() => chooseStorageMode("local")}
        >
          <div className="flex w-full items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Smartphone className="size-5" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Local only</span>
              <p className="text-xs text-muted-foreground">
                Quick start, single device
              </p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex-col items-start gap-2 p-5 text-left border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300"
          onClick={() => chooseStorageMode("sync")}
        >
          <div className="flex w-full items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Lock className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Sync across devices</span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-green-700">
                  Secure
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Zero-knowledge encryption · No account needed
              </p>
            </div>
          </div>
        </Button>
      </div>
    </>
  );
}
