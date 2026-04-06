import { describe, it, expect } from "vitest";
import { cleanLinks } from "@/core/cleaner/link-cleaner.ts";

describe("cleanLinks", () => {
  it("strips UTM parameters from href", () => {
    const html = `<a href="https://example.com/article?utm_source=rss&utm_medium=feed&utm_campaign=spring">Read</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://example.com/article">Read</a>`);
  });

  it("strips UTM parameters from img src", () => {
    const html = `<img src="https://example.com/img.jpg?utm_source=rss&width=100">`;
    expect(cleanLinks(html)).toBe(`<img src="https://example.com/img.jpg?width=100">`);
  });

  it("preserves non-tracking query parameters", () => {
    const html = `<a href="https://example.com/search?q=test&page=2">Search</a>`;
    expect(cleanLinks(html)).toBe(html);
  });

  it("strips fbclid parameter", () => {
    const html = `<a href="https://example.com/post?fbclid=abc123">Link</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://example.com/post">Link</a>`);
  });

  it("strips gclid parameter", () => {
    const html = `<a href="https://example.com/page?gclid=xyz789&ref=home">Link</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://example.com/page?ref=home">Link</a>`);
  });

  it("strips multiple tracking params at once", () => {
    const html = `<a href="https://example.com/p?utm_source=x&fbclid=y&utm_medium=z&id=5">Link</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://example.com/p?id=5">Link</a>`);
  });

  it("removes ? when all params are tracking", () => {
    const html = `<a href="https://example.com/article?utm_source=rss">Link</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://example.com/article">Link</a>`);
  });

  it("handles URLs without query strings", () => {
    const html = `<a href="https://example.com/clean">Link</a>`;
    expect(cleanLinks(html)).toBe(html);
  });

  it("handles multiple links in one string", () => {
    const html = `<a href="https://a.com?utm_source=x">A</a> <a href="https://b.com?page=1">B</a>`;
    expect(cleanLinks(html)).toBe(`<a href="https://a.com">A</a> <a href="https://b.com?page=1">B</a>`);
  });
});
