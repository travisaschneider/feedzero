import { describe, it, expect } from "vitest";
import { cleanFeedContent } from "@/core/cleaner/cleaner.ts";

describe("cleanFeedContent", () => {
  it("strips tracking pixels and UTM params in one pass", () => {
    const raw = [
      `<item>`,
      `<description>`,
      `&lt;p&gt;Article&lt;/p&gt;`,
      `&lt;a href="https://example.com/post?utm_source=rss"&gt;Read&lt;/a&gt;`,
      `&lt;img src="https://pixel.quantserve.com/p.gif" width="1" height="1"&gt;`,
      `</description>`,
      `</item>`,
    ].join("\n");

    const cleaned = cleanFeedContent(raw);
    expect(cleaned).not.toContain("utm_source");
    expect(cleaned).not.toContain("quantserve");
    expect(cleaned).toContain("Article");
  });

  it("leaves non-HTML feed XML structure intact", () => {
    const raw = `<rss><channel><title>Test</title><item><title>Hello</title></item></channel></rss>`;
    expect(cleanFeedContent(raw)).toBe(raw);
  });

  it("cleans encoded HTML inside CDATA sections", () => {
    const raw = `<description><![CDATA[<a href="https://ex.com?utm_source=rss">Link</a><img src="https://t.co/px" width="1" height="1">]]></description>`;
    const cleaned = cleanFeedContent(raw);
    expect(cleaned).not.toContain("utm_source");
    expect(cleaned).not.toContain("width=\"1\"");
    expect(cleaned).toContain("Link");
  });
});
