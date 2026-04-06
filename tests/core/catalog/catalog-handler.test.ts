import { describe, it, expect, beforeEach } from "vitest";
import { handleCatalogRequest, SUPPORTED_METHODS } from "@/core/catalog/catalog-handler.ts";
import { createMemoryCatalogAdapter } from "@/core/catalog/adapters/memory-adapter.ts";
import type { CatalogStorageAdapter } from "@/core/catalog/catalog-types.ts";

function request(method: string, path: string): Request {
  return new Request(`http://localhost${path}`, { method });
}

describe("catalog-handler", () => {
  let adapter: CatalogStorageAdapter;

  beforeEach(() => {
    adapter = createMemoryCatalogAdapter();
  });

  describe("GET /api/catalog?url=...", () => {
    it("returns 400 if url param is missing", async () => {
      const res = await handleCatalogRequest(request("GET", "/api/catalog"), adapter);
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown feed", async () => {
      const res = await handleCatalogRequest(
        request("GET", "/api/catalog?url=https://unknown.com/feed"),
        adapter,
      );
      expect(res.status).toBe(404);
    });

    it("returns catalog entry for known feed", async () => {
      await adapter.upsert("https://example.com/feed.xml");

      const res = await handleCatalogRequest(
        request("GET", "/api/catalog?url=https://example.com/feed.xml"),
        adapter,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.feed.url).toBe("https://example.com/feed.xml");
      expect(body.feed.requestCount).toBe(1);
    });
  });

  describe("GET /api/catalog?action=popular", () => {
    it("returns popular feeds sorted by request count", async () => {
      await adapter.upsert("https://a.com/feed");
      await adapter.upsert("https://b.com/feed");
      await adapter.upsert("https://b.com/feed");

      const res = await handleCatalogRequest(
        request("GET", "/api/catalog?action=popular&limit=10"),
        adapter,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.feeds[0].url).toBe("https://b.com/feed");
      expect(body.feeds[1].url).toBe("https://a.com/feed");
    });

    it("defaults to limit 50", async () => {
      await adapter.upsert("https://a.com/feed");

      const res = await handleCatalogRequest(
        request("GET", "/api/catalog?action=popular"),
        adapter,
      );
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.feeds).toHaveLength(1);
    });
  });

  describe("GET /api/catalog?action=count", () => {
    it("returns total feed count", async () => {
      await adapter.upsert("https://a.com/feed");
      await adapter.upsert("https://b.com/feed");

      const res = await handleCatalogRequest(
        request("GET", "/api/catalog?action=count"),
        adapter,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.count).toBe(2);
    });
  });

  it("returns 405 for unsupported methods", async () => {
    const res = await handleCatalogRequest(
      request("DELETE", "/api/catalog"),
      adapter,
    );
    expect(res.status).toBe(405);
  });

  it("exports SUPPORTED_METHODS for routing contract tests", () => {
    expect(SUPPORTED_METHODS).toContain("GET");
    expect(SUPPORTED_METHODS.length).toBeGreaterThan(0);
  });

  it("response has no user-identifying headers", async () => {
    await adapter.upsert("https://example.com/feed.xml");
    const res = await handleCatalogRequest(
      request("GET", "/api/catalog?url=https://example.com/feed.xml"),
      adapter,
    );
    expect(res.headers.get("Set-Cookie")).toBeNull();
    expect(res.headers.get("X-User-Id")).toBeNull();
  });
});
