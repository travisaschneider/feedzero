/**
 * Heuristic check for whether user input looks like a URL rather than
 * a search query. Used by the Explore search bar to decide between
 * catalog search and feed addition.
 *
 * False positives are acceptable — addFeed() will return an error toast.
 */
export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes("://")) return true;
  // Single token (no spaces) containing a dot → likely a domain
  return !trimmed.includes(" ") && trimmed.includes(".");
}
