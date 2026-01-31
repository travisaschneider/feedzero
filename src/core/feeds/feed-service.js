import { ok, err } from "../../utils/result.js";
import { parse } from "../parser/parser.js";
import { createFeed, createArticle } from "../storage/schema.js";
import { addFeed, getFeeds, addArticles } from "../storage/db.js";

/**
 * Full add-feed flow: check duplicate → fetch → parse → store.
 * Returns Result<{feed, articles}>.
 */
export async function addFeedFlow(url) {
  try {
    // Check for duplicate
    const existing = await getFeeds();
    if (existing.ok && existing.value.some((f) => f.url === url)) {
      return err("A feed with this URL already exists");
    }

    // Fetch feed content
    const proxyUrl = `/api/feed?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      return err(`Failed to fetch feed: ${response.status}`);
    }
    const text = await response.text();

    // Parse
    const parseResult = parse(text, url);
    if (!parseResult.ok) return parseResult;

    const { feed: feedData, articles: parsedArticles } = parseResult.value;

    // Create and store feed
    const feedResult = createFeed({
      url,
      title: feedData.title,
      description: feedData.description,
      siteUrl: feedData.siteUrl,
    });
    if (!feedResult.ok) return feedResult;

    const feed = feedResult.value;
    const storeResult = await addFeed(feed);
    if (!storeResult.ok) return storeResult;

    // Create and store articles
    const articles = parsedArticles
      .map((a) => {
        const r = createArticle({ feedId: feed.id, ...a });
        return r.ok ? r.value : null;
      })
      .filter(Boolean);

    await addArticles(articles);

    return ok({ feed, articles });
  } catch (e) {
    return err(`Error adding feed: ${e.message}`);
  }
}
