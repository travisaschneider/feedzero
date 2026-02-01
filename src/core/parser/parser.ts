import { ok, err } from "../../utils/result.ts";
import type { Result } from "../../utils/result.ts";
import { validate } from "./validator.ts";
import { sanitize } from "./sanitizer.ts";

interface ParsedFeed {
  title: string;
  description: string;
  siteUrl: string;
  url: string;
}

export interface ParsedArticle {
  title: string;
  link: string;
  content: string;
  summary: string;
  author: string;
  publishedAt: number | null;
  guid: string;
}

export interface ParseResult {
  feed: ParsedFeed;
  articles: ParsedArticle[];
}

/**
 * Parse an RSS 2.0, Atom 1.0, or JSON Feed 1.1 string.
 */
export function parse(xml: string, feedUrl: string): Result<ParseResult> {
  const typeResult = validate(xml);
  if (!typeResult.ok) return typeResult;

  const type = typeResult.value;

  if (type === "jsonfeed") {
    try {
      return parseJsonFeed(xml, feedUrl);
    } catch (e) {
      return err(`Parse error: ${(e as Error).message}`);
    }
  }

  const doc = new DOMParser().parseFromString(xml, "text/xml");

  try {
    if (type === "rss") return parseRss(doc, feedUrl);
    if (type === "atom") return parseAtom(doc, feedUrl);
    return err(`Unknown feed type: ${type}`);
  } catch (e) {
    return err(`Parse error: ${(e as Error).message}`);
  }
}

function parseRss(doc: Document, feedUrl: string): Result<ParseResult> {
  const channel = doc.querySelector("channel");
  if (!channel) return err("RSS feed missing <channel>");

  const feed: ParsedFeed = {
    title: text(channel, "title") || feedUrl,
    description: text(channel, "description") || "",
    siteUrl: text(channel, "link") || "",
    url: feedUrl,
  };

  const articles: ParsedArticle[] = [...channel.querySelectorAll("item")].map((item) => ({
    title: text(item, "title") || "Untitled",
    link: text(item, "link") || "",
    content: sanitize(
      text(item, "content:encoded") || text(item, "description") || "",
    ),
    summary: sanitize(text(item, "description") || ""),
    author: text(item, "author") || text(item, "dc:creator") || "",
    publishedAt: parseDate(text(item, "pubDate")),
    guid: text(item, "guid") || text(item, "link") || "",
  }));

  return ok({ feed, articles });
}

function parseAtom(doc: Document, feedUrl: string): Result<ParseResult> {
  const root = doc.documentElement;

  const feed: ParsedFeed = {
    title: text(root, "title") || feedUrl,
    description: text(root, "subtitle") || "",
    siteUrl: linkHref(root, "alternate") || "",
    url: feedUrl,
  };

  const articles: ParsedArticle[] = [...root.querySelectorAll("entry")].map((entry) => ({
    title: text(entry, "title") || "Untitled",
    link: linkHref(entry, "alternate") || linkHref(entry) || "",
    content: sanitize(text(entry, "content") || text(entry, "summary") || ""),
    summary: sanitize(text(entry, "summary") || ""),
    author: text(entry.querySelector("author"), "name") || "",
    publishedAt: parseDate(text(entry, "published") || text(entry, "updated")),
    guid: text(entry, "id") || linkHref(entry) || "",
  }));

  return ok({ feed, articles });
}

/** Decode HTML entities that survive XML parsing (double-encoded feeds). */
function decodeEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.textContent || "";
}

function text(parent: Element | null, tag: string): string {
  if (!parent) return "";
  // Use getElementsByTagName for reliable namespaced element lookup
  // (querySelector fails with namespace-prefixed tags like content:encoded)
  const els = parent.getElementsByTagName(tag);
  if (els.length === 0) return "";
  return decodeEntities((els[0].textContent || "").trim());
}

function linkHref(parent: Element | null, rel?: string): string {
  if (!parent) return "";
  const links = parent.querySelectorAll("link");
  for (const link of links) {
    if (!rel || link.getAttribute("rel") === rel) {
      return link.getAttribute("href") || "";
    }
  }
  return "";
}

function parseJsonFeed(jsonStr: string, feedUrl: string): Result<ParseResult> {
  const data = JSON.parse(jsonStr);

  const feed: ParsedFeed = {
    title: data.title || feedUrl,
    description: data.description || "",
    siteUrl: data.home_page_url || "",
    url: feedUrl,
  };

  const articles: ParsedArticle[] = (data.items || []).map((item: Record<string, unknown>) => {
    const authors = item.authors as Array<{ name?: string }> | undefined;
    const author = item.author as { name?: string } | undefined;
    const authorName = authors?.[0]?.name || author?.name || "";
    return {
      title: (item.title as string) || "Untitled",
      link: (item.url as string) || (item.external_url as string) || "",
      content: sanitize((item.content_html as string) || (item.content_text as string) || ""),
      summary: sanitize((item.summary as string) || ""),
      author: authorName,
      publishedAt: parseDate(item.date_published as string),
      guid: (item.id as string) || (item.url as string) || "",
    };
  });

  return ok({ feed, articles });
}

function parseDate(str: string | null | undefined): number | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.getTime();
}
