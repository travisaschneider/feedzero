import { create } from "zustand";
import { getFeeds, getFeed, removeFeed as dbRemoveFeed } from "../core/storage/db.ts";
import { addFeedFlow, refreshFeed, refreshAllFeeds } from "../core/feeds/feed-service.ts";
import type { Feed } from "../types/index.ts";

interface FeedStore {
  feeds: Feed[];
  selectedFeedId: string | null;
  isLoading: boolean;
  error: string | null;
  loadFeeds: () => Promise<void>;
  addFeed: (url: string) => Promise<void>;
  removeFeed: (feedId: string) => Promise<void>;
  selectFeed: (feedId: string) => void;
  refreshAll: () => Promise<void>;
  refreshSingleFeed: (feedId: string) => Promise<void>;
}

let isRefreshingAll = false;

export const useFeedStore = create<FeedStore>((set, get) => ({
  feeds: [],
  selectedFeedId: null,
  isLoading: false,
  error: null,

  loadFeeds: async () => {
    const result = await getFeeds();
    if (result.ok) {
      set({ feeds: result.value });
    } else {
      set({ feeds: [], error: result.error });
    }
  },

  addFeed: async (url) => {
    set({ isLoading: true, error: null });
    const result = await addFeedFlow(url);
    if (!result.ok) {
      set({ isLoading: false, error: result.error });
      return;
    }
    const allFeeds = await getFeeds();
    set({
      feeds: allFeeds.ok ? allFeeds.value : get().feeds,
      selectedFeedId: result.value.feed.id,
      isLoading: false,
    });
  },

  removeFeed: async (feedId) => {
    const result = await dbRemoveFeed(feedId);
    if (!result.ok) return;
    const allFeeds = await getFeeds();
    const currentSelection = get().selectedFeedId;
    set({
      feeds: allFeeds.ok ? allFeeds.value : [],
      selectedFeedId: currentSelection === feedId ? null : currentSelection,
    });
  },

  selectFeed: (feedId) => set({ selectedFeedId: feedId }),

  refreshAll: async () => {
    if (isRefreshingAll) return;
    isRefreshingAll = true;
    try {
      await refreshAllFeeds();
      const allFeeds = await getFeeds();
      if (allFeeds.ok) set({ feeds: allFeeds.value });
    } finally {
      isRefreshingAll = false;
    }
  },

  refreshSingleFeed: async (feedId) => {
    const feedResult = await getFeed(feedId);
    if (!feedResult.ok) return;
    await refreshFeed(feedResult.value);
  },
}));
