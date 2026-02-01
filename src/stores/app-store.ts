import { create } from "zustand";
import { open } from "../core/storage/db.ts";

interface AppStore {
  isDbReady: boolean;
  error: string | null;
  initialize: (passphrase: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isDbReady: false,
  error: null,

  initialize: async (passphrase) => {
    const result = await open(passphrase);
    if (result.ok) {
      set({ isDbReady: true, error: null });
    } else {
      set({ isDbReady: false, error: result.error });
    }
  },

  setError: (error) => set({ error }),
}));
