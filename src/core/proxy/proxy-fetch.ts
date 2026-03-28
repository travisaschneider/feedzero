/** Client-side timeout for proxy requests (ms). */
const PROXY_TIMEOUT = 20_000;

/**
 * Fetch a URL via the CORS proxy using POST to keep target URLs
 * out of server access logs and browser history.
 */
export async function proxyFetch(
  endpoint: string,
  targetUrl: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT);
  try {
    return await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
