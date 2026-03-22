import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFeedCache } from "@/core/proxy/feed-cache";

describe("feed-cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null on cache miss", () => {
    const cache = createFeedCache();
    expect(cache.get("https://example.com/feed.xml")).toBeNull();
  });

  it("returns cached response on cache hit", () => {
    const cache = createFeedCache();
    const body = new TextEncoder().encode("<rss/>").buffer;
    cache.set("https://example.com/feed.xml", body, "text/xml", 200);

    const result = cache.get("https://example.com/feed.xml");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(200);
    expect(result!.contentType).toBe("text/xml");
  });

  it("evicts entries after TTL expires", () => {
    const cache = createFeedCache(1000); // 1s TTL
    const body = new TextEncoder().encode("<rss/>").buffer;
    cache.set("https://example.com/feed.xml", body, "text/xml", 200);

    // Before TTL
    expect(cache.get("https://example.com/feed.xml")).not.toBeNull();

    // After TTL
    vi.advanceTimersByTime(1001);
    expect(cache.get("https://example.com/feed.xml")).toBeNull();
  });

  it("tracks request counts per URL independently", () => {
    const cache = createFeedCache();
    cache.get("https://a.com/feed");
    cache.get("https://a.com/feed");
    cache.get("https://b.com/feed");

    const stats = cache.getStats();
    const a = stats.find((s) => s.url === "https://a.com/feed");
    const b = stats.find((s) => s.url === "https://b.com/feed");
    expect(a!.requests).toBe(2);
    expect(b!.requests).toBe(1);
  });

  it("stats are sorted by request count descending", () => {
    const cache = createFeedCache();
    cache.get("https://a.com/feed");
    cache.get("https://b.com/feed");
    cache.get("https://b.com/feed");
    cache.get("https://b.com/feed");

    const stats = cache.getStats();
    expect(stats[0].url).toBe("https://b.com/feed");
    expect(stats[1].url).toBe("https://a.com/feed");
  });

  it("stats include cached status", () => {
    const cache = createFeedCache();
    const body = new TextEncoder().encode("<rss/>").buffer;
    cache.set("https://a.com/feed", body, "text/xml", 200);
    cache.get("https://a.com/feed");
    cache.get("https://b.com/feed"); // miss, not cached

    const stats = cache.getStats();
    expect(stats.find((s) => s.url === "https://a.com/feed")!.cached).toBe(
      true,
    );
    expect(stats.find((s) => s.url === "https://b.com/feed")!.cached).toBe(
      false,
    );
  });

  it("records requests even on cache miss", () => {
    const cache = createFeedCache();
    cache.get("https://example.com/feed");
    cache.get("https://example.com/feed");

    const stats = cache.getStats();
    expect(stats[0].requests).toBe(2);
  });

  it("reports cache size", () => {
    const cache = createFeedCache();
    expect(cache.size).toBe(0);

    const body = new TextEncoder().encode("<rss/>").buffer;
    cache.set("https://a.com/feed", body, "text/xml", 200);
    cache.set("https://b.com/feed", body, "text/xml", 200);
    expect(cache.size).toBe(2);
  });
});
