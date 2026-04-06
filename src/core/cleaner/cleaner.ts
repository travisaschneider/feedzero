import { stripTrackers } from "./tracker-stripper.ts";
import { cleanLinks } from "./link-cleaner.ts";

/**
 * Clean feed content by stripping trackers and tracking parameters.
 * Operates on the raw feed text (XML/HTML), applying cleaners to
 * both plain HTML and HTML inside CDATA sections and entity-encoded content.
 */
export function cleanFeedContent(raw: string): string {
  // Apply cleaners to the full text — works on both raw HTML and
  // entity-encoded HTML (&lt;a href=...&gt;) and CDATA sections
  let result = raw;

  // Clean CDATA sections
  result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, content) => {
    return `<![CDATA[${cleanLinks(stripTrackers(content))}]]>`;
  });

  // Clean entity-encoded HTML (decode, clean, re-encode)
  result = result.replace(/&lt;([\s\S]*?)&gt;/g, (match) => {
    const decoded = match
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');
    const cleaned = cleanLinks(stripTrackers(decoded));
    return cleaned
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });

  return result;
}
