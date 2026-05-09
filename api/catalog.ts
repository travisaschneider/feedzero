// @ts-nocheck
// api/catalog.ts
var API_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff"
};
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: API_HEADERS });
}
function errorResponse(message, status) {
  return jsonResponse({ ok: false, error: message }, status);
}
async function handleGet(request, adapter2) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action === "popular") {
    return handlePopular(url, adapter2);
  }
  if (action === "count") {
    return handleCount(adapter2);
  }
  return handleGetFeed(url, adapter2);
}
async function handleGetFeed(url, adapter2) {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return errorResponse("Missing url parameter", 400);
  const result = await adapter2.get(feedUrl);
  if (!result.ok) return errorResponse(result.error, 500);
  if (result.value === null) return errorResponse("Feed not found", 404);
  return jsonResponse({ ok: true, feed: result.value });
}
async function handlePopular(url, adapter2) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const result = await adapter2.popular(limit);
  if (!result.ok) return errorResponse(result.error, 500);
  return jsonResponse({ ok: true, feeds: result.value });
}
async function handleCount(adapter2) {
  const result = await adapter2.count();
  if (!result.ok) return errorResponse(result.error, 500);
  return jsonResponse({ ok: true, count: result.value });
}
var methodHandlers = {
  GET: handleGet
};
var SUPPORTED_METHODS = Object.keys(methodHandlers);
async function handleCatalogRequest(request, adapter2) {
  const handler = methodHandlers[request.method];
  if (!handler) return errorResponse("Method not allowed", 405);
  return handler(request, adapter2);
}
function ok(value) {
  return { ok: true, value };
}
function createMemoryCatalogAdapter() {
  const store = /* @__PURE__ */ new Map();
  return {
    async upsert(url) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existing = store.get(url);
      if (existing) {
        existing.requestCount += 1;
        existing.lastRequestedAt = now;
      } else {
        store.set(url, {
          url,
          title: null,
          description: null,
          siteUrl: null,
          status: "active",
          requestCount: 1,
          lastRequestedAt: now,
          lastCrawledAt: null,
          errorCount: 0,
          lastError: null,
          createdAt: now
        });
      }
      return ok(true);
    },
    async get(url) {
      return ok(store.get(url) ?? null);
    },
    async popular(limit) {
      const sorted = [...store.values()].sort(
        (a, b) => b.requestCount - a.requestCount
      );
      return ok(sorted.slice(0, limit));
    },
    async updateMetadata(url, metadata) {
      const existing = store.get(url);
      if (existing) {
        Object.assign(existing, metadata);
      }
      return ok(true);
    },
    async count() {
      return ok(store.size);
    }
  };
}
var adapter = createMemoryCatalogAdapter();
async function GET(req) {
  return handleCatalogRequest(req, adapter);
}
export {
  GET
};
