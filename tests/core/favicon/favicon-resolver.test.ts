import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveIconUrl } from "@/core/favicon/favicon-resolver";

describe("resolveIconUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns well-known path when HEAD request succeeds with good size", async () => {
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

  it("skips tiny placeholder favicons and falls through to HTML parsing", async () => {
    const fetchMock = vi.fn()
      // All well-known paths return 198-byte placeholder
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/x-icon",
          "content-length": "198",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/x-icon",
          "content-length": "198",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "image/x-icon",
          "content-length": "198",
        }),
      })
      // HTML has a proper icon
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="/wp-content/icon.png" sizes="192x192"></head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/wp-content/icon.png");
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

  it("survives fetch HEAD throwing (timeout/network) and tries the next path", async () => {
    const fetchMock = vi.fn()
      // First well-known HEAD aborts (e.g. AbortSignal timeout) — falls through
      .mockRejectedValueOnce(new Error("aborted"))
      // Second well-known HEAD also throws — falls through
      .mockRejectedValueOnce(new Error("network down"))
      // Third well-known HEAD also throws — falls through to HTML parsing
      .mockRejectedValueOnce(new Error("network down"))
      // HTML fetch returns a valid icon
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="/icon.png" sizes="64x64"></head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/icon.png");
  });

  it("falls back to DuckDuckGo when the HTML fetch itself throws", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // HTML fetch throws (DNS error, TLS handshake failure, etc.)
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://icons.duckduckgo.com/ip3/example.com.ico");
  });

  it("skips href values that fail URL parsing (e.g. out-of-range port)", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head>' +
            // Port 99999 is out of range — `new URL` throws TypeError
            '<link rel="icon" href="http://broken.example:99999/icon.png">' +
            '<link rel="icon" href="/good.png" sizes="32x32">' +
            '</head></html>',
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    // The bad href is silently skipped; the good href wins.
    const result = await resolveIconUrl("https://example.com");
    expect(result).toBe("https://example.com/good.png");
  });
});
