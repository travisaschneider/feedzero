import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../../src/stores/app-store.ts";

vi.mock("../../src/core/storage/db.ts", () => ({
  open: vi.fn(),
}));

import { open } from "../../src/core/storage/db.ts";

describe("app-store", () => {
  beforeEach(() => {
    useAppStore.setState({ isDbReady: false, error: null });
    vi.clearAllMocks();
  });

  it("starts with db not ready and no error", () => {
    const state = useAppStore.getState();
    expect(state.isDbReady).toBe(false);
    expect(state.error).toBeNull();
  });

  it("initialize sets isDbReady on success", async () => {
    vi.mocked(open).mockResolvedValue({ ok: true, value: true });

    await useAppStore.getState().initialize("test-key");

    const state = useAppStore.getState();
    expect(state.isDbReady).toBe(true);
    expect(state.error).toBeNull();
    expect(open).toHaveBeenCalledWith("test-key");
  });

  it("initialize sets error on failure", async () => {
    vi.mocked(open).mockResolvedValue({ ok: false, error: "DB failed" });

    await useAppStore.getState().initialize("test-key");

    const state = useAppStore.getState();
    expect(state.isDbReady).toBe(false);
    expect(state.error).toBe("DB failed");
  });

  it("setError updates error state", () => {
    useAppStore.getState().setError("something broke");
    expect(useAppStore.getState().error).toBe("something broke");

    useAppStore.getState().setError(null);
    expect(useAppStore.getState().error).toBeNull();
  });
});
