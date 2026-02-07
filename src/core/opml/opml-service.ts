import { parseOpml, generateOpml } from "feedsmith";
import { ok, err } from "../../utils/result.ts";
import type { Result } from "../../utils/result.ts";
import type { Feed } from "../../types/index.ts";

/** Represents a feed entry extracted from OPML. */
export interface OpmlFeedEntry {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
}

/**
 * Parse an OPML file and extract feed entries.
 * Flattens nested folder structures, returning only entries with xmlUrl.
 */
export function parseOpmlFile(xml: string): Result<OpmlFeedEntry[]> {
  if (!xml || typeof xml !== "string" || !xml.trim()) {
    return err("OPML content is empty");
  }

  try {
    const doc = parseOpml(xml);
    const feeds = extractFeeds(doc.body?.outlines || []);
    return ok(feeds);
  } catch (e) {
    return err(`Failed to parse OPML: ${(e as Error).message}`);
  }
}

/**
 * Recursively extract feed entries from OPML outlines.
 * Flattens nested folders and only returns outlines with xmlUrl.
 */
function extractFeeds(
  outlines: Array<{
    text?: string;
    title?: string;
    xmlUrl?: string;
    htmlUrl?: string;
    outlines?: unknown[];
  }>,
): OpmlFeedEntry[] {
  const feeds: OpmlFeedEntry[] = [];

  for (const outline of outlines) {
    if (outline.xmlUrl) {
      feeds.push({
        title: outline.title || outline.text || "",
        xmlUrl: outline.xmlUrl,
        htmlUrl: outline.htmlUrl,
      });
    }

    // Recursively process nested outlines (folders)
    if (outline.outlines && Array.isArray(outline.outlines)) {
      feeds.push(...extractFeeds(outline.outlines as typeof outlines));
    }
  }

  return feeds;
}

/**
 * Generate an OPML file from an array of Feed objects.
 * Returns a valid OPML document even for empty feeds array.
 */
export function generateOpmlFile(feeds: Feed[]): string {
  // feedsmith requires at least one outline, so handle empty case manually
  if (feeds.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>FeedZero Subscriptions</title>
  </head>
  <body>
  </body>
</opml>`;
  }

  return generateOpml({
    head: {
      title: "FeedZero Subscriptions",
    },
    body: {
      outlines: feeds.map((feed) => ({
        type: "rss",
        text: feed.title,
        title: feed.title,
        xmlUrl: feed.url,
        htmlUrl: feed.siteUrl || undefined,
      })),
    },
  });
}

/**
 * Generate a plain text list of feed URLs, one per line.
 */
export function generateUrlList(feeds: Feed[]): string {
  return feeds.map((feed) => feed.url).join("\n");
}
