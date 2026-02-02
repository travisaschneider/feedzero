import { CloudOff, Cloud, Loader2, CloudAlert } from "lucide-react";
import { useSyncStore } from "@/stores/sync-store";

const STATUS_CONFIG = {
  "local-only": { icon: CloudOff, label: "Local only" },
  syncing: { icon: Loader2, label: "Syncing..." },
  synced: { icon: Cloud, label: "Synced" },
  error: { icon: CloudAlert, label: "Sync error" },
} as const;

export function SyncStatusChip() {
  const status = useSyncStore((s) => s.status);
  const setDialogOpen = useSyncStore((s) => s.setDialogOpen);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <button
      onClick={() => setDialogOpen(true)}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
    >
      <Icon
        className={`size-3.5 ${status === "syncing" ? "animate-spin" : ""}`}
      />
      <span>{config.label}</span>
    </button>
  );
}
