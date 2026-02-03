import { create } from "zustand";

export type SyncStatus = "local-only" | "syncing" | "synced" | "error";

interface SyncStore {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  passphrase: string | null;
  dialogOpen: boolean;
  setSyncing: () => void;
  setSynced: (timestamp: number) => void;
  setSyncError: (error: string) => void;
  enableSync: (passphrase: string) => void;
  disableSync: () => void;
  setDialogOpen: (open: boolean) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: "local-only",
  lastSyncedAt: null,
  error: null,
  passphrase: null,
  dialogOpen: false,
  setSyncing: () => set({ status: "syncing" }),
  setSynced: (timestamp) =>
    set({ status: "synced", lastSyncedAt: timestamp, error: null }),
  setSyncError: (error) => set({ status: "error", error }),
  enableSync: (passphrase) => set({ passphrase, status: "syncing" }),
  disableSync: () =>
    set({
      status: "local-only",
      lastSyncedAt: null,
      error: null,
      passphrase: null,
    }),
  setDialogOpen: (open) => set({ dialogOpen: open }),
}));
