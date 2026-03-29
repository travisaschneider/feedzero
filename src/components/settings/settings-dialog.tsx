import { useState } from "react";
import { toast } from "sonner";
import { ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { clearFaviconCache } from "@/components/feeds/feed-favicon";
import { ImportView } from "./import-view";
import { ExportView } from "./export-view";

type SettingsView = "import" | "export" | "general";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function GeneralView() {
  function handleClearFavicons() {
    clearFaviconCache();
    try {
      localStorage.removeItem("feedzero:favicon-cache");
    } catch {
      // localStorage unavailable
    }
    toast.success("Favicon cache cleared — reload the page to refresh icons");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Reload favicons</div>
          <div className="text-xs text-muted-foreground">
            Clear cached favicons so they re-download on next page load.
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearFavicons}>
          <ImageOff className="size-3.5" />
          Clear cache
        </Button>
      </div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [view, setView] = useState<SettingsView>("import");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setView("import");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as SettingsView)}
          className="justify-start"
        >
          <ToggleGroupItem value="general" aria-label="General settings">
            General
          </ToggleGroupItem>
          <ToggleGroupItem value="import" aria-label="Import feeds">
            Import
          </ToggleGroupItem>
          <ToggleGroupItem value="export" aria-label="Export feeds">
            Export
          </ToggleGroupItem>
        </ToggleGroup>

        {view === "general" && <GeneralView />}
        {view === "import" && <ImportView onClose={() => onOpenChange(false)} />}
        {view === "export" && <ExportView />}
      </DialogContent>
    </Dialog>
  );
}
