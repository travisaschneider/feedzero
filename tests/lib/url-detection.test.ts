import { describe, it, expect } from "vitest";
import { looksLikeUrl } from "@/lib/url-detection.ts";

describe("looksLikeUrl", () => {
  it("returns false for empty string", () => {
    expect(looksLikeUrl("")).toBe(false);
  });

  it("returns false for whitespace only", () => {
    expect(looksLikeUrl("   ")).toBe(false);
  });

  it("returns true for full URL with protocol", () => {
    expect(looksLikeUrl("https://example.com/feed")).toBe(true);
  });

  it("returns true for http URL", () => {
    expect(looksLikeUrl("http://example.com")).toBe(true);
  });

  it("returns true for domain without protocol", () => {
    expect(looksLikeUrl("example.com")).toBe(true);
  });

  it("returns true for subdomain path", () => {
    expect(looksLikeUrl("feed.example.com/rss")).toBe(true);
  });

  it("returns false for single word", () => {
    expect(looksLikeUrl("react")).toBe(false);
  });

  it("returns false for multi-word search query", () => {
    expect(looksLikeUrl("my search query")).toBe(false);
  });

  it("returns false for search with special chars but no dot", () => {
    expect(looksLikeUrl("tech & science")).toBe(false);
  });

  it("returns true for minimal domain (a.b)", () => {
    expect(looksLikeUrl("a.b")).toBe(true);
  });

  it("returns true for URL with port", () => {
    expect(looksLikeUrl("localhost:3000")).toBe(false);
    expect(looksLikeUrl("example.com:8080")).toBe(true);
  });

  it("trims whitespace before checking", () => {
    expect(looksLikeUrl("  example.com  ")).toBe(true);
  });

  it("returns false for multi-word with dots", () => {
    expect(looksLikeUrl("Mr. Smith")).toBe(false);
  });
});
