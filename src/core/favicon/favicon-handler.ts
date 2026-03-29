import { resolveIconUrl } from "./favicon-resolver.ts";
import { validateProxyUrl } from "../proxy/validate-url.ts";

/**
 * Handle favicon discovery requests. Takes a domain, resolves the best
 * favicon URL, fetches the image, and returns it.
 *
 * Query params:
 *   ?domain=example.com — the site to find a favicon for
 */
export async function handleFaviconRequest(
  req: Request,
): Promise<Response> {
  const url = new URL(req.url, "http://localhost");
  const domain = url.searchParams.get("domain");

  if (!domain) {
    return new Response("Missing domain parameter", { status: 400 });
  }

  const origin = `https://${domain}`;
  const validation = validateProxyUrl(origin);
  if (!validation.ok) {
    return new Response(validation.error, { status: 400 });
  }

  try {
    const iconUrl = await resolveIconUrl(origin);

    const res = await fetch(iconUrl, {
      headers: { "User-Agent": "FeedZero/1.0 (RSS Reader)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new Response("Favicon not found", { status: 404 });
    }

    const body = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") || "image/x-icon";

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Favicon fetch failed", { status: 502 });
  }
}
