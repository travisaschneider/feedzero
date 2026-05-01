import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { FeedSwitcherSheet } from "@/components/layout/feed-switcher-sheet.tsx";
import { useFeedStore } from "@/stores/feed-store.ts";
import { useArticleStore } from "@/stores/article-store.ts";

vi.mock("@/core/storage/db.ts", () => ({
  getArticles: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  updateArticle: vi.fn().mockResolvedValue({ ok: true, value: true }),
  getFeeds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  getFeed: vi.fn(),
  removeFeed: vi.fn(),
  updateFeed: vi.fn(),
  getFolders: vi.fn().mockResolvedValue({ ok: true, value: [] }),
}));

vi.mock("@/core/feeds/feed-service.ts", () => ({
  addFeedFlow: vi.fn(),
  refreshFeed: vi.fn(),
  refreshAllFeeds: vi.fn(),
}));

const makeFeed = (id: string, title: string) => ({
  id,
  url: `https://example.com/${id}`,
  title,
  description: "",
  siteUrl: `https://example.com`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function renderSheet(props: Partial<React.ComponentProps<typeof FeedSwitcherSheet>> = {}) {
  return render(
    <MemoryRouter>
      <FeedSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        onFeedSelect={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("FeedSwitcherSheet", () => {
  beforeEach(() => {
    useFeedStore.setState({ feeds: [], selectedFeedId: null, isLoading: false, error: null, isRefreshingAll: false, refreshingFeedIds: new Set() });
    useArticleStore.setState({ articles: [], articlesByFeedId: {}, selectedArticle: null, isLoading: false });
  });

  it("renders sheet content when open is true", () => {
    const { container } = renderSheet({ open: true });
    expect(container.ownerDocument.querySelector("[data-slot='sheet-content']")).not.toBeNull();
  });

  it("does not render sheet content when open is false", () => {
    const { container } = renderSheet({ open: false });
    expect(container.ownerDocument.querySelector("[data-slot='sheet-content']")).toBeNull();
  });

  it("renders feed names from the store inside the open sheet", () => {
    useFeedStore.setState({ feeds: [makeFeed("f1", "Hacker News"), makeFeed("f2", "The Verge")] });
    renderSheet();
    expect(screen.getByText("Hacker News")).toBeInTheDocument();
    expect(screen.getByText("The Verge")).toBeInTheDocument();
  });

  it("calls onFeedSelect with the correct feedId when a feed is tapped", async () => {
    const user = userEvent.setup();
    const onFeedSelect = vi.fn();
    useFeedStore.setState({ feeds: [makeFeed("f1", "Hacker News")] });
    renderSheet({ onFeedSelect });
    await user.click(screen.getByText("Hacker News"));
    expect(onFeedSelect).toHaveBeenCalledWith("f1");
  });

  it("calls onOpenChange(false) after a feed is selected", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    useFeedStore.setState({ feeds: [makeFeed("f1", "Hacker News")] });
    renderSheet({ onOpenChange });
    await user.click(screen.getByText("Hacker News"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders an All items entry at the top of the sheet", () => {
    renderSheet();
    expect(screen.getByText("All items")).toBeInTheDocument();
  });

  it("calls onFeedSelect with ALL_FEEDS_ID when All items is tapped", async () => {
    const user = userEvent.setup();
    const onFeedSelect = vi.fn();
    renderSheet({ onFeedSelect });
    await user.click(screen.getByText("All items"));
    expect(onFeedSelect).toHaveBeenCalledWith("all");
  });

  it("sheet content slides from bottom (has border-t class from side='bottom')", () => {
    const { container } = renderSheet();
    const content = container.ownerDocument.querySelector("[data-slot='sheet-content']") as HTMLElement;
    expect(content?.className).toContain("border-t");
  });

  it("scroll container inside sheet has max-h-[70dvh] to stay within thumb reach", () => {
    const { container } = renderSheet();
    const content = container.ownerDocument.querySelector("[data-slot='sheet-content']") as HTMLElement;
    const scrollContainer = content?.querySelector(".overflow-y-auto");
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain("max-h-[70dvh]");
  });
});
