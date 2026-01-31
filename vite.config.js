import { defineConfig } from "vite";

function feedProxyPlugin() {
  return {
    name: "feed-proxy",
    configureServer(server) {
      server.middlewares.use("/api/feed", async (req, res) => {
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
            response.headers.get("content-type") || "text/xml",
          );
          res.statusCode = response.status;
          const body = await response.text();
          res.end(body);
        } catch (e) {
          res.statusCode = 502;
          res.end(`Proxy error: ${e.message}`);
        }
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [feedProxyPlugin()],
});
