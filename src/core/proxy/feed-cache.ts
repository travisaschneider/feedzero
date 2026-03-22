/**
 * In-memory TTL cache for proxied feed responses.
 *
 * Privacy guarantees:
 * - No user identity attached to cache entries
 * - No session correlation — each feed URL is an independent entry
 * - No request grouping — cannot determine which feeds a single user reads
 * - No timestamps on subscriber counts — only a running total
 * - In-memory only — lost on server restart, never persisted to disk
 *
 * The subscriber count is a simple per-URL counter that increments on every
 * unique-within-window request. It tells the operator "BBC News is popular"
 * but never "user X reads BBC News AND Daring Fireball."
 */

interface CacheEntry {
  body: ArrayBuffer;
  contentType: string;
  status: number;
  cachedAt: number;
}

interface FeedStats {
  /** Total requests (including cache hits) */
  requests: number;
}

export interface FeedCacheStats {
  url: string;
  requests: number;
  cached: boolean;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function createFeedCache(ttlMs = DEFAULT_TTL_MS) {
  const cache = new Map<string, CacheEntry>();
  const stats = new Map<string, FeedStats>();

  /** Record a request for analytics. No user identity, no session, no IP. */
  function recordRequest(url: string): void {
    const entry = stats.get(url);
    if (entry) {
      entry.requests++;
    } else {
      stats.set(url, { requests: 1 });
    }
  }

  return {
    /**
     * Get a cached response if fresh, or null if stale/missing.
     * Always records the request for analytics regardless of cache hit.
     */
    get(url: string): { body: ArrayBuffer; contentType: string; status: number } | null {
      recordRequest(url);

      const entry = cache.get(url);
      if (!entry) return null;

      if (Date.now() - entry.cachedAt > ttlMs) {
        cache.delete(url);
        return null;
      }

      return { body: entry.body, contentType: entry.contentType, status: entry.status };
    },

    /** Store a response in the cache. */
    set(url: string, body: ArrayBuffer, contentType: string, status: number): void {
      cache.set(url, { body, contentType, status, cachedAt: Date.now() });
    },

    /**
     * Get anonymous aggregate stats.
     * Returns per-feed request counts — no user identity, no correlation.
     */
    getStats(): FeedCacheStats[] {
      return Array.from(stats.entries())
        .map(([url, s]) => ({
          url,
          requests: s.requests,
          cached: cache.has(url),
        }))
        .sort((a, b) => b.requests - a.requests);
    },

    /** Number of feeds currently cached. */
    get size(): number {
      return cache.size;
    },
  };
}

export type FeedCache = ReturnType<typeof createFeedCache>;
