import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedList } from "@/components/feeds/feed-list.tsx";
import { useFeedStore } from "@/stores/feed-store.ts";

vi.mock("@/core/storage/db.ts", () => ({
  getFeeds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  getFeed: vi.fn(),
  removeFeed: vi.fn(),
}));

vi.mock("@/core/feeds/feed-service.ts", () => ({
  addFeedFlow: vi.fn(),
  refreshFeed: vi.fn(),
  refreshAllFeeds: vi.fn(),
}));

const mockFeed = (id: string, title: string) => ({
  id, url: `https://${id}.com/feed`, title, description: "",
  siteUrl: `https://${id}.com`, createdAt: Date.now(), updatedAt: Date.now(),
});

describe("FeedList", () => {
  beforeEach(() => {
    useFeedStore.setState({
      feeds: [], selectedFeedId: null, isLoading: false, error: null,
    });
  });

  it("shows empty state when no feeds", () => {
    render(<FeedList />);
    expect(screen.getByText("No feeds yet. Add one above.")).toBeInTheDocument();
  });

  it("renders feed items", () => {
    useFeedStore.setState({
      feeds: [mockFeed("a", "Alpha Feed"), mockFeed("b", "Beta Feed")],
      selectedFeedId: null, isLoading: false, error: null,
    });

    render(<FeedList />);
    expect(screen.getByText("Alpha Feed")).toBeInTheDocument();
    expect(screen.getByText("Beta Feed")).toBeInTheDocument();
  });

  it("highlights selected feed", () => {
    useFeedStore.setState({
      feeds: [mockFeed("a", "Alpha Feed")],
      selectedFeedId: "a", isLoading: false, error: null,
    });

    render(<FeedList />);
    const item = screen.getByRole("option");
    expect(item).toHaveAttribute("aria-selected", "true");
  });

  it("calls onFeedSelect when feed clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    useFeedStore.setState({
      feeds: [mockFeed("a", "Alpha Feed")],
      selectedFeedId: null, isLoading: false, error: null,
    });

    render(<FeedList onFeedSelect={onSelect} />);
    await user.click(screen.getByText("Alpha Feed"));

    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("shows error message", () => {
    useFeedStore.setState({
      feeds: [], selectedFeedId: null, isLoading: false,
      error: "Something went wrong",
    });

    render(<FeedList />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("has add feed form", () => {
    render(<FeedList />);
    expect(screen.getByPlaceholderText("Enter feed URL...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("has refresh all button", () => {
    render(<FeedList />);
    expect(screen.getByTitle("Refresh all feeds")).toBeInTheDocument();
  });
});
