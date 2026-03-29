import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveIconUrl } from "@/core/favicon/favicon-resolver";

describe("resolveIconUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns well-known path when HEAD request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/x-icon",
          "content-length": "1000",
        }),
      }),
    );

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/favicon.ico");
  });

  it("parses HTML link tags when well-known paths fail", async () => {
    const fetchMock = vi.fn()
      // All HEAD requests fail
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // HTML fetch succeeds
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="/wp-content/icon.png" sizes="32x32"></head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/wp-content/icon.png");
  });

  it("prefers larger icons from HTML link tags", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head>' +
            '<link rel="icon" href="/icon-32.png" sizes="32x32">' +
            '<link rel="icon" href="/icon-192.png" sizes="192x192">' +
            '<link rel="apple-touch-icon" href="/apple-180.png">' +
            '</head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/icon-192.png");
  });

  it("falls back to DuckDuckGo when HTML parsing fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // HTML fetch fails (Cloudflare block)
      .mockResolvedValueOnce({ ok: false, status: 403 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://www.appleinsider.com");
    expect(result).toBe(
      "https://icons.duckduckgo.com/ip3/www.appleinsider.com.ico",
    );
  });

  it("resolves absolute URLs from HTML link tags", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="https://cdn.example.com/icon.png"></head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://cdn.example.com/icon.png");
  });

  it("skips HTML link tags without href", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon"></head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    // No valid icon in HTML, falls back to DuckDuckGo
    expect(result).toBe("https://icons.duckduckgo.com/ip3/example.com.ico");
  });
});
