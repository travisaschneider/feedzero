import { useState } from "react";
import { Rss } from "lucide-react";

interface FeedFaviconProps {
  siteUrl: string;
  className?: string;
}

/**
 * Favicon URL strategies, tried in order.
 * "path:" entries append to the origin. "endpoint:" entries are called directly.
 */
type FaviconStrategy =
  | { type: "path"; path: string }
  | { type: "endpoint"; buildUrl: (origin: string) => string };

const STRATEGIES: FaviconStrategy[] = [
  { type: "path", path: "/favicon.ico" },
  { type: "path", path: "/favicon.png" },
  { type: "path", path: "/apple-touch-icon.png" },
  {
    type: "endpoint",
    buildUrl: (origin) => {
      const host = new URL(origin).host;
      return `/api/favicon?domain=${encodeURIComponent(host)}`;
    },
  },
];

const STORAGE_KEY = "feedzero:favicon-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  index: number;
  ts: number;
}

/**
 * Persistent favicon cache: origin → { index, ts }.
 * Loaded from localStorage on startup, written back on every resolution.
 * Failed entries (index === -1) expire after 24 hours to allow retry.
 */
const resolvedCache: Map<string, CacheEntry> = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    const entries: [string, number | CacheEntry][] = JSON.parse(stored);
    const now = Date.now();
    const map = new Map<string, CacheEntry>();
    for (const [key, val] of entries) {
      // Migrate legacy format (plain number) to new format
      const entry: CacheEntry =
        typeof val === "number" ? { index: val, ts: now } : val;
      // Skip expired failures
      if (entry.index < 0 && now - entry.ts > CACHE_TTL_MS) continue;
      map.set(key, entry);
    }
    return map;
  } catch {
    // localStorage unavailable or corrupt
    return new Map();
  }
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

/** Remove failed entries so they retry on next render. */
export function retryFailedFavicons() {
  let changed = false;
  for (const [key, entry] of resolvedCache) {
    if (entry.index < 0) {
      resolvedCache.delete(key);
      changed = true;
    }
  }
  if (changed) persistCache();
}

/** Inject a cache entry directly (used by tests). */
export function setFaviconCacheEntry(
  origin: string,
  index: number,
  ts: number,
) {
  resolvedCache.set(origin, { index, ts });
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
  const isExpired =
    cached !== undefined &&
    cached.index < 0 &&
    Date.now() - cached.ts > CACHE_TTL_MS;
  const initialIndex =
    cached !== undefined && !isExpired ? cached.index : 0;
  const [pathIndex, setPathIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);

  if (!siteUrl || pathIndex < 0 || pathIndex >= STRATEGIES.length) {
    return <Rss className={`${className} text-muted-foreground shrink-0`} />;
  }

  const strategy = STRATEGIES[pathIndex];
  const faviconUrl =
    strategy.type === "path"
      ? `/api/icon?url=${encodeURIComponent(origin + strategy.path)}`
      : strategy.buildUrl(origin);

  return (
    <>
      {!loaded && (
        <Rss className={`${className} text-muted-foreground shrink-0`} />
      )}
      <img
        src={faviconUrl}
        alt=""
        className={`${className} shrink-0 rounded-sm ring-1 ring-border/50 ${loaded ? "" : "hidden"}`}
        onLoad={() => {
          resolvedCache.set(origin, { index: pathIndex, ts: Date.now() });
          persistCache();
          setLoaded(true);
        }}
        onError={() => {
          const next = pathIndex + 1;
          if (next < STRATEGIES.length) {
            setPathIndex(next);
            setLoaded(false);
          } else {
            resolvedCache.set(origin, { index: -1, ts: Date.now() });
            persistCache();
            setPathIndex(-1);
          }
        }}
      />
    </>
  );
}
