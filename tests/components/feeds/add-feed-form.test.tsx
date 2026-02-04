import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddFeedForm } from "@/components/feeds/add-feed-form.tsx";
import { useFeedStore } from "@/stores/feed-store.ts";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe("AddFeedForm", () => {
  const onAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useFeedStore.setState({
      feeds: [],
      selectedFeedId: null,
      isLoading: false,
      error: null,
    });
  });

  it("uses input-group for consistent input+button height", () => {
    const { container } = render(<AddFeedForm onAdded={onAdded} />);
    expect(
      container.querySelector("[data-slot='input-group']"),
    ).toBeInTheDocument();
  });

  it("input has inputMode url", () => {
    render(<AddFeedForm onAdded={onAdded} />);
    expect(screen.getByLabelText("Feed URL")).toHaveAttribute(
      "inputMode",
      "url",
    );
  });

  it("input has type text, not url", () => {
    render(<AddFeedForm onAdded={onAdded} />);
    expect(screen.getByLabelText("Feed URL")).toHaveAttribute("type", "text");
  });

  it("input has required attribute", () => {
    render(<AddFeedForm onAdded={onAdded} />);
    expect(screen.getByLabelText("Feed URL")).toBeRequired();
  });

  it("form has aria-label", () => {
    render(<AddFeedForm onAdded={onAdded} />);
    expect(screen.getByRole("form")).toHaveAttribute("aria-label", "Add feed");
  });

  it("submit button shows pending text during loading", () => {
    useFeedStore.setState({ isLoading: true });
    render(<AddFeedForm onAdded={onAdded} />);
    expect(
      screen.getByRole("button", { name: /adding feed/i }),
    ).toBeInTheDocument();
  });

  it("submit button has aria-busy during loading", () => {
    useFeedStore.setState({ isLoading: true });
    render(<AddFeedForm onAdded={onAdded} />);
    expect(
      screen.getByRole("button", { name: /adding feed/i }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("input is hidden during loading", () => {
    useFeedStore.setState({ isLoading: true });
    render(<AddFeedForm onAdded={onAdded} />);
    expect(screen.queryByLabelText("Feed URL")).not.toBeInTheDocument();
  });

  it("calls addFeed with entered URL on submit", async () => {
    const user = userEvent.setup();
    const addFeed = vi.fn().mockResolvedValue(undefined);
    useFeedStore.setState({ addFeed, error: null });

    render(<AddFeedForm onAdded={onAdded} />);
    await user.type(
      screen.getByLabelText("Feed URL"),
      "https://example.com/feed",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(addFeed).toHaveBeenCalledWith("https://example.com/feed");
  });

  it("shows loading toast on submit", async () => {
    const user = userEvent.setup();
    useFeedStore.setState({
      addFeed: vi.fn().mockResolvedValue(undefined),
      error: null,
    });

    render(<AddFeedForm onAdded={onAdded} />);
    await user.type(screen.getByLabelText("Feed URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(toast.loading).toHaveBeenCalledWith("Discovering feed…");
  });

  it("shows success toast when feed added", async () => {
    const user = userEvent.setup();
    useFeedStore.setState({
      addFeed: vi.fn().mockResolvedValue(undefined),
      error: null,
    });

    render(<AddFeedForm onAdded={onAdded} />);
    await user.type(screen.getByLabelText("Feed URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Feed added", {
        id: "toast-id",
      });
    });
  });

  it("shows error toast on failure", async () => {
    const user = userEvent.setup();
    useFeedStore.setState({
      addFeed: vi.fn().mockImplementation(async () => {
        useFeedStore.setState({ error: "Invalid feed URL" });
      }),
    });

    render(<AddFeedForm onAdded={onAdded} />);
    await user.type(screen.getByLabelText("Feed URL"), "bad-url");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid feed URL", {
        id: "toast-id",
      });
    });
  });

  it("clears input after successful add", async () => {
    const user = userEvent.setup();
    useFeedStore.setState({
      addFeed: vi.fn().mockResolvedValue(undefined),
      error: null,
    });

    render(<AddFeedForm onAdded={onAdded} />);
    const input = screen.getByLabelText("Feed URL");
    await user.type(input, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("calls onCancel when Escape is pressed in input", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AddFeedForm onAdded={onAdded} onCancel={onCancel} />);
    const input = screen.getByLabelText("Feed URL");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not call onCancel when other keys are pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AddFeedForm onAdded={onAdded} onCancel={onCancel} />);
    const input = screen.getByLabelText("Feed URL");
    await user.click(input);
    await user.keyboard("hello");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onFeedSelect with new feed ID after successful add", async () => {
    const user = userEvent.setup();
    const onFeedSelect = vi.fn();
    useFeedStore.setState({
      addFeed: vi.fn().mockImplementation(async () => {
        useFeedStore.setState({ selectedFeedId: "new-feed-123" });
      }),
      error: null,
    });

    render(<AddFeedForm onAdded={onAdded} onFeedSelect={onFeedSelect} />);
    await user.type(screen.getByLabelText("Feed URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(onFeedSelect).toHaveBeenCalledWith("new-feed-123");
    });
  });

  it("calls onAdded callback on success", async () => {
    const user = userEvent.setup();
    useFeedStore.setState({
      addFeed: vi.fn().mockResolvedValue(undefined),
      error: null,
    });

    render(<AddFeedForm onAdded={onAdded} />);
    await user.type(screen.getByLabelText("Feed URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled();
    });
  });
});
