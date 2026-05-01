import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AutoOrganizePill } from "@/components/folders/auto-organize-pill";
import { useFeedStore } from "@/stores/feed-store";
import { useArticleStore } from "@/stores/article-store";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

vi.mock("@/core/storage/db.ts", () => ({
  getFeeds: vi.fn(),
  getFeed: vi.fn(),
  updateFeed: vi.fn().mockResolvedValue({ ok: true, value: true }),
  getFolders: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  addFolder: vi.fn().mockResolvedValue({ ok: true, value: true }),
}));

vi.mock("@/stores/sync-store", () => ({
  useSyncStore: {
    getState: () => ({ scheduleSyncPush: vi.fn() }),
  },
}));

const LS_KEY = "feedzero:auto-organize-dismissed-count";

function makeFeed(id: string, folderId?: string) {
  return {
    id,
    url: `https://example.com/${id}.xml`,
    title: `Feed ${id}`,
    description: "",
    siteUrl: `https://example.com/${id}`,
    folderId,
    createdAt: 0,
    updatedAt: 0,
  };
}

function setFeeds(count: number, foldered = 0) {
  const feeds: ReturnType<typeof makeFeed>[] = [];
  for (let i = 0; i < count; i++) {
    feeds.push(makeFeed(`f${i}`, i < foldered ? "fold-x" : undefined));
  }
  useFeedStore.setState({ feeds, folders: [] });
}

describe("AutoOrganizePill", () => {
  beforeEach(() => {
    useArticleStore.setState({ articlesByFeedId: {}, articles: [] });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders when there are more than 10 feeds and at least one is unfiled", () => {
    setFeeds(12, 0);
    render(<AutoOrganizePill />);
    expect(screen.getByTestId("auto-organize-pill")).toBeInTheDocument();
  });

  it("does not render when there are 10 or fewer feeds", () => {
    setFeeds(10, 0);
    render(<AutoOrganizePill />);
    expect(screen.queryByTestId("auto-organize-pill")).toBeNull();
  });

  it("does not render when all feeds are already in folders", () => {
    setFeeds(15, 15);
    render(<AutoOrganizePill />);
    expect(screen.queryByTestId("auto-organize-pill")).toBeNull();
  });

  it("clicking the pill text opens the auto-organize dialog", async () => {
    const user = userEvent.setup();
    setFeeds(12, 0);
    render(<AutoOrganizePill />);

    await user.click(screen.getByText("Auto-organize feeds"));

    expect(
      screen.getByRole("heading", { name: /Auto-organize feeds/i }),
    ).toBeInTheDocument();
  });

  it("has a violet color scheme", () => {
    setFeeds(12, 0);
    render(<AutoOrganizePill />);
    const pill = screen.getByTestId("auto-organize-pill");
    // The pill uses violet-based Tailwind classes for the magical/AI feel
    expect(pill.className).toMatch(/violet/);
  });

  describe("dismiss behavior", () => {
    it("shows a dismiss button", () => {
      setFeeds(12, 0);
      render(<AutoOrganizePill />);
      expect(screen.getByLabelText(/dismiss/i)).toBeInTheDocument();
    });

    it("clicking dismiss hides the pill", async () => {
      const user = userEvent.setup();
      setFeeds(12, 0);
      render(<AutoOrganizePill />);
      expect(screen.getByTestId("auto-organize-pill")).toBeInTheDocument();

      await user.click(screen.getByLabelText(/dismiss/i));

      expect(screen.queryByTestId("auto-organize-pill")).toBeNull();
    });

    it("stores the unfiled count in localStorage on dismiss", async () => {
      const user = userEvent.setup();
      setFeeds(12, 0); // 12 unfiled
      render(<AutoOrganizePill />);

      await user.click(screen.getByLabelText(/dismiss/i));

      expect(localStorage.getItem(LS_KEY)).toBe("12");
    });

    it("stays hidden after dismiss when unfiled count has not grown significantly", () => {
      localStorage.setItem(LS_KEY, "12");
      setFeeds(13, 0); // 13 unfiled — only 1 new, below the 5-feed re-show gap
      render(<AutoOrganizePill />);
      expect(screen.queryByTestId("auto-organize-pill")).toBeNull();
    });

    it("re-shows when 5 or more new unfiled feeds have been added since dismiss", () => {
      localStorage.setItem(LS_KEY, "12");
      setFeeds(17, 0); // 17 unfiled — 5 new feeds since dismiss at 12
      render(<AutoOrganizePill />);
      expect(screen.getByTestId("auto-organize-pill")).toBeInTheDocument();
    });

    it("clears dismiss when the user organizes feeds below the dismissed count", () => {
      // Dismissed at 12 unfiled. User organized, now only 8 unfiled.
      localStorage.setItem(LS_KEY, "12");
      setFeeds(8, 0);
      render(<AutoOrganizePill />);
      // Below threshold so pill is invisible, but dismiss state is cleared
      expect(localStorage.getItem(LS_KEY)).toBeNull();
    });
  });
});
