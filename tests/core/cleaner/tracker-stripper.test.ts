import { describe, it, expect } from "vitest";
import { stripTrackers } from "@/core/cleaner/tracker-stripper.ts";

describe("stripTrackers", () => {
  it("removes 1x1 tracking pixel images", () => {
    const html = `<p>Hello</p><img src="https://tracker.com/pixel.gif" width="1" height="1" />`;
    expect(stripTrackers(html)).toBe("<p>Hello</p>");
  });

  it("removes 0x0 tracking pixel images", () => {
    const html = `<p>Text</p><img src="https://t.co/track" width="0" height="0">`;
    expect(stripTrackers(html)).toBe("<p>Text</p>");
  });

  it("preserves normal images", () => {
    const html = `<img src="https://example.com/photo.jpg" width="800" height="600">`;
    expect(stripTrackers(html)).toBe(html);
  });

  it("preserves images without explicit dimensions", () => {
    const html = `<img src="https://example.com/photo.jpg" alt="photo">`;
    expect(stripTrackers(html)).toBe(html);
  });

  it("removes known tracker domain images regardless of size", () => {
    const html = `<img src="https://www.facebook.com/tr?id=123&ev=PageView">`;
    expect(stripTrackers(html)).toBe("");
  });

  it("removes feedburner tracker images", () => {
    const html = `<p>Content</p><img src="http://feeds.feedburner.com/~r/somefeed/~4/abc123" height="1" width="1" />`;
    expect(stripTrackers(html)).toBe("<p>Content</p>");
  });

  it("removes images from known tracker domains", () => {
    const trackerUrls = [
      "https://pixel.quantserve.com/pixel/abc.gif",
      "https://sb.scorecardresearch.com/p?c1=2",
      "https://analytics.twitter.com/i/adsct",
      "https://www.google-analytics.com/collect",
    ];
    for (const url of trackerUrls) {
      const html = `<img src="${url}">`;
      expect(stripTrackers(html)).toBe("");
    }
  });

  it("removes Feedblitz tracking images", () => {
    const html = `<img src="https://feeds.feedblitz.com/~/i/123/0/example" width="1" height="1">`;
    expect(stripTrackers(html)).toBe("");
  });

  it("handles mixed content with trackers and real images", () => {
    const html = [
      `<p>Article text</p>`,
      `<img src="https://example.com/hero.jpg" width="640" height="480">`,
      `<img src="https://pixel.quantserve.com/pixel/p.gif" width="1" height="1">`,
      `<p>More text</p>`,
    ].join("");

    const result = stripTrackers(html);
    expect(result).toContain("hero.jpg");
    expect(result).not.toContain("quantserve");
  });
});
