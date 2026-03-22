import { validateProxyUrl } from "./validate-url.ts";
import type { FeedCache } from "./feed-cache.ts";

/**
 * HTTP methods the proxy handler accepts.
 * Every routing layer (Vercel exports, Hono, Vite dev) must accept
 * all of these. Tested by the routing contract in server.test.ts.
 */
export const SUPPORTED_METHODS: readonly string[] = ["GET", "POST"];

export interface ProxyOptions {
  /** Optional feed cache for deduplication across users. */
  cache?: FeedCache;
}

/**
 * Shared proxy logic for serverless functions.
 * Validates the target URL, fetches it, and returns the response.
 * If a cache is provided, feed responses are cached by URL with a TTL.
 */
export async function handleProxyRequest(
  req: Request,
  defaultContentType: string,
  options?: ProxyOptions,
): Promise<Response> {
  const target = await extractTargetUrl(req);

  const validation = validateProxyUrl(target);
  if (!validation.ok) {
    const status =
      validation.error === "Access to internal addresses is blocked"
        ? 403
        : 400;
    return new Response(validation.error, { status });
  }

  const url = validation.value.href;
  const cache = options?.cache;

  // Check cache first
  if (cache) {
    const cached = cache.get(url);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: { "Content-Type": cached.contentType },
      });
    }
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "FeedZero/1.0 (RSS Reader)" },
    });
    const contentType =
      response.headers.get("content-type") || defaultContentType;
    const body = await response.arrayBuffer();

    // Cache successful feed/page responses
    if (cache && response.status >= 200 && response.status < 400) {
      cache.set(url, body, contentType, response.status);
    }

    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        context: "proxy",
        target: url,
        error: message,
        timestamp: new Date().toISOString(),
      }),
    );
    return new Response(`Proxy error: ${message}`, { status: 502 });
  }
}

/** Extract target URL from POST body (preferred) or GET query param (fallback). */
async function extractTargetUrl(req: Request): Promise<string | null> {
  if (req.method === "POST") {
    try {
      const body = (await req.json()) as { url?: string };
      return body.url ?? null;
    } catch {
      return null;
    }
  }
  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get("url");
}
