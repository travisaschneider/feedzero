import type { CatalogStorageAdapter } from "./catalog-types.ts";

const API_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: API_HEADERS });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ ok: false, error: message }, status);
}

async function handleGet(
  request: Request,
  adapter: CatalogStorageAdapter,
): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "popular") {
    return handlePopular(url, adapter);
  }

  if (action === "count") {
    return handleCount(adapter);
  }

  return handleGetFeed(url, adapter);
}

async function handleGetFeed(
  url: URL,
  adapter: CatalogStorageAdapter,
): Promise<Response> {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return errorResponse("Missing url parameter", 400);

  const result = await adapter.get(feedUrl);
  if (!result.ok) return errorResponse(result.error, 500);
  if (result.value === null) return errorResponse("Feed not found", 404);

  return jsonResponse({ ok: true, feed: result.value });
}

async function handlePopular(
  url: URL,
  adapter: CatalogStorageAdapter,
): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const result = await adapter.popular(limit);
  if (!result.ok) return errorResponse(result.error, 500);

  return jsonResponse({ ok: true, feeds: result.value });
}

async function handleCount(
  adapter: CatalogStorageAdapter,
): Promise<Response> {
  const result = await adapter.count();
  if (!result.ok) return errorResponse(result.error, 500);

  return jsonResponse({ ok: true, count: result.value });
}

type MethodHandler = (
  request: Request,
  adapter: CatalogStorageAdapter,
) => Promise<Response>;

const methodHandlers: Record<string, MethodHandler> = {
  GET: handleGet,
};

/** HTTP methods supported by the catalog endpoint. */
export const SUPPORTED_METHODS: readonly string[] = Object.keys(methodHandlers);

/** Shared catalog request handler using the Web standard Request/Response API. */
export async function handleCatalogRequest(
  request: Request,
  adapter: CatalogStorageAdapter,
): Promise<Response> {
  const handler = methodHandlers[request.method];
  if (!handler) return errorResponse("Method not allowed", 405);
  return handler(request, adapter);
}
