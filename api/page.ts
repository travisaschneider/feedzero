/**
 * Vercel serverless function for proxying web page requests.
 * Endpoint: /api/page?url=<encoded-page-url>
 *
 * Used for full-text article extraction (fetches HTML for Defuddle processing).
 * Includes SSRF protections to block internal/private IP addresses.
 *
 * NOTE: Code is inlined (not imported from src/) because Vercel doesn't bundle
 * external dependencies by default. The serverless function must be self-contained.
 */

// ===== Result Type (from src/utils/result.ts) =====

type Result<T> = Ok<T> | Err;

interface Ok<T> {
  ok: true;
  value: T;
}

interface Err {
  ok: false;
  error: string;
}

function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

function err(error: string): Err {
  return { ok: false, error };
}

// ===== URL Validation with SSRF Protection (from src/core/proxy/validate-url.ts) =====

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254",
]);

const BLOCKED_PREFIXES = ["10.", "192.168.", "172.16."];

/**
 * Validates a URL for proxying: checks for presence, allowed protocols,
 * and blocks internal/private addresses (SSRF protection).
 */
function validateProxyUrl(url: string | null | undefined): Result<URL> {
  if (!url) {
    return err("Missing url parameter");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return err("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return err("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    BLOCKED_PREFIXES.some((prefix) => hostname.startsWith(prefix))
  ) {
    return err("Access to internal addresses is blocked");
  }

  return ok(parsed);
}

// ===== Proxy Handler Logic (from src/core/proxy/proxy-handler.ts) =====

/**
 * Proxy handler logic for serverless function.
 * Validates the target URL, fetches it, and returns the response.
 *
 * @param req - The incoming request with ?url=<target> query parameter
 * @param defaultContentType - Fallback content type if upstream doesn't provide one
 * @returns Response with proxied content or error message
 */
async function handleProxyRequest(
  req: Request,
  defaultContentType: string,
): Promise<Response> {
  const url = new URL(req.url, "http://localhost");
  const target = url.searchParams.get("url");

  const validation = validateProxyUrl(target);
  if (!validation.ok) {
    const status =
      validation.error === "Access to internal addresses is blocked"
        ? 403
        : 400;
    return new Response(validation.error, { status });
  }

  try {
    const response = await fetch(validation.value.href);
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || defaultContentType,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(`Proxy error: ${message}`, { status: 502 });
  }
}

// ===== Vercel Serverless Function Entry Point =====

export default async function handler(req: Request): Promise<Response> {
  return handleProxyRequest(req, "text/html");
}
