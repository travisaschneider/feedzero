import type { Article } from "@/types";

/**
 * Find the article that follows `current` in the loaded list.
 *
 * Returns null when there's nothing to advance to: no current article,
 * the list is empty, the current article isn't in the list, or it is
 * the last entry. Pure — used by both the inline reader pill and the
 * floating mobile pill so they always agree on what "next" means.
 */
export function findNextArticle(
  articles: Article[],
  current: Article | null,
): Article | null {
  if (!current) return null;
  const idx = articles.findIndex((a) => a.id === current.id);
  if (idx < 0 || idx >= articles.length - 1) return null;
  return articles[idx + 1];
}
