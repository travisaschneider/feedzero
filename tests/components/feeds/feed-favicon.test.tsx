import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { FeedFavicon } from "@/components/feeds/feed-favicon";

describe("FeedFavicon", () => {
  it("routes favicon requests through the proxy to prevent IP leakage", () => {
    const { container } = render(<FeedFavicon siteUrl="https://example.com" />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe(
      "/api/icon?url=https%3A%2F%2Fexample.com%2Ffavicon.ico",
    );
  });

  it("shows fallback icon when siteUrl is empty", () => {
    const { container } = render(<FeedFavicon siteUrl="" />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows fallback icon on image load error", () => {
    const { container } = render(<FeedFavicon siteUrl="https://example.com" />);
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("shows fallback icon for invalid URL", () => {
    const { container } = render(<FeedFavicon siteUrl="not-a-url" />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows fallback icon while image is loading", () => {
    const { container } = render(<FeedFavicon siteUrl="https://example.com" />);
    // Before onLoad fires, fallback SVG should be visible
    expect(container.querySelector("svg")).toBeTruthy();
    // Img exists but is hidden
    const img = container.querySelector("img")!;
    expect(img.classList.contains("hidden")).toBe(true);
  });

  it("hides fallback icon after image loads successfully", () => {
    const { container } = render(<FeedFavicon siteUrl="https://example.com" />);
    const img = container.querySelector("img")!;
    fireEvent.load(img);
    // After load, SVG fallback should be gone and img visible
    expect(container.querySelector("svg")).toBeNull();
    expect(img.classList.contains("hidden")).toBe(false);
  });
});
