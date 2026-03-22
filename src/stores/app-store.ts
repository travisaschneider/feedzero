import { create } from "zustand";
import {
  initFresh,
  restore,
  destroy,
} from "../core/storage/key-manager.ts";
import { LOCAL_STORAGE } from "../utils/constants.ts";
import { useSyncStore } from "./sync-store.ts";

interface AppStore {
  isDbReady: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean | null;
  /** Initialize a fresh DB for new users (onboarding). */
  initialize: (passphrase: string, options?: { sync: boolean }) => Promise<void>;
  /** Restore DB for returning users from stored keys. */
  initializeReturningUser: () => Promise<void>;
  setError: (error: string | null) => void;
  completeOnboarding: () => void;
  checkOnboardingStatus: () => void;
  resetApp: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  isDbReady: false,
  error: null,
  hasCompletedOnboarding: null,

  initialize: async (passphrase, options) => {
    const result = await initFresh(passphrase, options);
    if (!result.ok) {
      set({ isDbReady: false, error: result.error });
      return;
    }

    if (result.value.credentials) {
      useSyncStore.setState({ credentials: result.value.credentials });
    }

    set({ isDbReady: true, error: null });
  },

  initializeReturningUser: async () => {
    const status = await restore();

    if (status.status !== "ready") {
      // Keys missing or invalid — clean slate, re-onboard
      await destroy();
      set({ isDbReady: false, error: null, hasCompletedOnboarding: false });
      return;
    }

    if (status.credentials) {
      useSyncStore.setState({ credentials: status.credentials });
    }

    set({ isDbReady: true, error: null });

    if (status.isSyncUser) {
      await useSyncStore.getState().pull();
      if (useSyncStore.getState().status !== "error") {
        useSyncStore.setState({ status: "synced", lastSyncedAt: Date.now() });
      }
    }
  },

  setError: (error) => set({ error }),

  completeOnboarding: () => {
    localStorage.setItem(LOCAL_STORAGE.ONBOARDING_COMPLETE, "true");
    set({ hasCompletedOnboarding: true });
  },

  checkOnboardingStatus: () => {
    const completed =
      localStorage.getItem(LOCAL_STORAGE.ONBOARDING_COMPLETE) === "true";
    set({ hasCompletedOnboarding: completed });
  },

  resetApp: async () => {
    await destroy();
    set({ isDbReady: false, error: null, hasCompletedOnboarding: false });
    await resetAllStores();
  },
}));

/**
 * Reset all stores to initial state. Called by sync-store.logout()
 * to avoid cross-store knowledge in individual stores.
 */
export async function resetAllStores(): Promise<void> {
  const { useFeedStore } = await import("./feed-store.ts");
  const { useArticleStore } = await import("./article-store.ts");
  const { useOnboardingStore } = await import("./onboarding-store.ts");
  useAppStore.setState({ isDbReady: false, hasCompletedOnboarding: false });
  useFeedStore.setState({ feeds: [], selectedFeedId: null });
  useArticleStore.setState({ articles: [], selectedArticle: null });
  useOnboardingStore.getState().reset();
}
