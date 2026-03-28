import { useState } from "react";
import { Rss } from "lucide-react";

interface FeedFaviconProps {
  siteUrl: string;
  className?: string;
}

/** Well-known favicon paths, tried in order. */
const FAVICON_PATHS = [
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
];

const STORAGE_KEY = "feedzero:favicon-cache";

/**
 * Persistent favicon cache: origin → resolved path index (or -1 for "all failed").
 * Loaded from localStorage on startup, written back on every resolution.
 * Eliminates all favicon retry requests on page reload.
 */
const resolvedCache: Map<string, number> = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Map(JSON.parse(stored));
  } catch {
    // localStorage unavailable or corrupt
  }
  return new Map();
})();

function persistCache() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(resolvedCache.entries())),
    );
  } catch {
    // localStorage unavailable
  }
}

/** Clear the favicon cache (used by tests). */
export function clearFaviconCache() {
  resolvedCache.clear();
}

/** Displays a feed's favicon with fallback chain, proxied through /api/icon. */
export function FeedFavicon({
  siteUrl,
  className = "size-4",
}: FeedFaviconProps) {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return <Rss className={`${className} text-muted-foreground shrink-0`} />;
  }

  const cached = resolvedCache.get(origin);
  const [pathIndex, setPathIndex] = useState(cached !== undefined ? cached : 0);
  const [loaded, setLoaded] = useState(false);

  if (!siteUrl || pathIndex < 0) {
    return <Rss className={`${className} text-muted-foreground shrink-0`} />;
  }

  const faviconUrl = `/api/icon?url=${encodeURIComponent(origin + FAVICON_PATHS[pathIndex])}`;

  return (
    <>
      {!loaded && (
        <Rss className={`${className} text-muted-foreground shrink-0`} />
      )}
      <img
        src={faviconUrl}
        alt=""
        className={`${className} shrink-0 rounded-sm ${loaded ? "" : "hidden"}`}
        onLoad={() => {
          resolvedCache.set(origin, pathIndex);
          persistCache();
          setLoaded(true);
        }}
        onError={() => {
          const next = pathIndex + 1;
          if (next < FAVICON_PATHS.length) {
            setPathIndex(next);
            setLoaded(false);
          } else {
            resolvedCache.set(origin, -1);
            persistCache();
            setPathIndex(-1);
          }
        }}
      />
    </>
  );
}
