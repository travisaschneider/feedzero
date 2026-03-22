import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useAppStore } from "@/stores/app-store";
import { useFeedStore } from "@/stores/feed-store";
import { useSyncStore } from "@/stores/sync-store";

vi.mock("@/core/storage/key-manager", () => ({
  initFresh: vi.fn().mockResolvedValue({
    ok: true,
    value: { credentials: null },
  }),
  restore: vi.fn().mockResolvedValue({
    status: "ready",
    isSyncUser: false,
    credentials: null,
  }),
  destroy: vi.fn().mockResolvedValue(undefined),
  addVaultKeys: vi.fn(),
  removeVaultKeys: vi.fn(),
  destroyLocal: vi.fn().mockResolvedValue(undefined),
  rekeyFromPassphrase: vi.fn().mockResolvedValue({ ok: true, value: {} }),
}));

vi.mock("@/core/feeds/feed-service.ts", () => ({
  addFeedFlow: vi.fn(),
  refreshAllFeeds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
}));

vi.mock("@/core/sync/sync-service", () => ({
  pushVault: vi.fn().mockResolvedValue({ ok: true, value: Date.now() }),
  pullVault: vi.fn().mockResolvedValue({
    ok: true,
    value: { version: 1, exportedAt: Date.now(), feeds: [], articles: [] },
  }),
  importVault: vi.fn().mockResolvedValue({ ok: true, value: true }),
  deleteVault: vi.fn().mockResolvedValue({ ok: true, value: true }),
}));

vi.mock("@/core/sync/vault-crypto", () => ({
  deriveVaultId: vi.fn().mockResolvedValue({ ok: true, value: "mock-vault-id" }),
  deriveVaultKey: vi.fn().mockResolvedValue({ ok: true, value: "mock-vault-key" }),
}));

vi.mock("@/core/storage/db.ts", () => ({
  getFeeds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
}));

import { refreshAllFeeds } from "@/core/feeds/feed-service";
import { restore } from "@/core/storage/key-manager";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

let App: typeof import("@/app").App;

describe("App sync-aware init", () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useAppStore.setState({
      isDbReady: false,
      error: null,
      hasCompletedOnboarding: null,
    });
    useSyncStore.setState({
      status: "local-only",
      lastSyncedAt: null,
      error: null,
      credentials: null,
      dialogOpen: false,
    });
    useFeedStore.setState({
      feeds: [],
      selectedFeedId: null,
      isLoading: false,
      error: null,
    });

    const mod = await import("@/app");
    App = mod.App;
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("initializes for local-only returning users", async () => {
    vi.mocked(restore).mockResolvedValue({
      status: "ready",
      isSyncUser: false,
      credentials: null,
    });
    localStorageMock.setItem("feedzero:onboarding-complete", "true");

    render(<App />);

    await waitFor(() => {
      expect(useAppStore.getState().isDbReady).toBe(true);
    });

    expect(useSyncStore.getState().status).toBe("local-only");
  });

  it("auto-refreshes all feeds on app load for returning users", async () => {
    vi.mocked(restore).mockResolvedValue({
      status: "ready",
      isSyncUser: false,
      credentials: null,
    });
    localStorageMock.setItem("feedzero:onboarding-complete", "true");

    render(<App />);

    await waitFor(() => {
      expect(useAppStore.getState().isDbReady).toBe(true);
    });

    await waitFor(() => {
      expect(refreshAllFeeds).toHaveBeenCalled();
    });
  });

  it("restores sync state for returning sync users", async () => {
    const mockCredentials = {
      vaultId: "stored-vault-id",
      vaultKey: "mock-key" as unknown as CryptoKey,
    };
    vi.mocked(restore).mockResolvedValue({
      status: "ready",
      isSyncUser: true,
      credentials: mockCredentials,
    });
    localStorageMock.setItem("feedzero:onboarding-complete", "true");

    render(<App />);

    await waitFor(() => {
      expect(useAppStore.getState().isDbReady).toBe(true);
    });

    expect(useSyncStore.getState().credentials).not.toBeNull();
    expect(useSyncStore.getState().status).toBe("synced");
  });
});
