const textarea = document.createElement("textarea");

/** Decode HTML entities (e.g. &#8220; → "). Safe for plain text only. */
export function decodeEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  textarea.innerHTML = str;
  return textarea.textContent || str;
}
