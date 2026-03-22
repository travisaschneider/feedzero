/** Decode HTML entities (e.g. &#8220; → "). Safe for plain text only. */
export function decodeEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.body.textContent || str;
}
