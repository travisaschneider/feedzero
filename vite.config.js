import { defineConfig } from "vite";

/**
 * Generic proxy handler for server-side fetches (bypasses CORS).
 * Used by both /api/feed and /api/page endpoints.
 */
function proxyHandler(defaultContentType) {
  return async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const target = url.searchParams.get("url");
    if (!target) {
      res.statusCode = 400;
      res.end("Missing url parameter");
      return;
    }

    try {
      const response = await fetch(target);
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") || defaultContentType,
      );
      res.statusCode = response.status;
      const body = await response.text();
      res.end(body);
    } catch (e) {
      res.statusCode = 502;
      res.end(`Proxy error: ${e.message}`);
    }
  };
}

function feedProxyPlugin() {
  return {
    name: "feed-proxy",
    configureServer(server) {
      server.middlewares.use("/api/feed", proxyHandler("text/xml"));
      server.middlewares.use("/api/page", proxyHandler("text/html"));
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [feedProxyPlugin()],
});
