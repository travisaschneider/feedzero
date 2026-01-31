# Feature 003: Full-Text Extraction

## Status
Implemented

## Summary

Feeds that only provide a short summary (no `content:encoded` or `content_html`) now have their articles' full text extracted from the linked web page using Defuddle. The extractor architecture is pluggable — swap one import to use a different library (e.g. Readability).

## Behaviour

```gherkin
Feature: Full-text extraction for summary-only feeds

  Scenario: Feed provides full content
    Given a feed with content:encoded in every item
    When the user adds the feed
    Then articles display the feed-provided content as-is
    And no additional page fetches occur

  Scenario: Feed provides only summaries
    Given a feed where items have only short description/summary
    When the user adds the feed
    Then each article's linked page is fetched via /api/page
    And Defuddle extracts readable content from the HTML
    And extracted content replaces the summary in the article

  Scenario: Page fetch fails
    Given a summary-only feed where article pages are unreachable
    When the user adds the feed
    Then extraction failures are silently ignored
    And articles retain their original summary content
```

## Architecture

### Flow

1. `feed-service.js` parses the feed as normal (RSS/Atom/JSON Feed)
2. For each parsed article, `needsExtraction()` checks:
   - Does it have a valid HTTP link?
   - Is content empty or identical to summary?
   - Is summary shorter than 500 characters?
3. If extraction needed: fetch the article's `link` via `/api/page?url=...`
4. Pass HTML to `extract()` → Defuddle parses DOM → strips clutter → returns clean HTML
5. Extracted content is sanitized through DOMPurify (same pipeline as feed content)
6. Article's `content` field is replaced with extracted text
7. Storage and UI are unaware extraction happened — `content` field is populated either way

### Files

| File | Role |
|------|------|
| `src/core/extractor/extractor.js` | Public API: `extract()` delegates to implementation, `needsExtraction()` heuristic |
| `src/core/extractor/defuddle-extractor.js` | Defuddle wrapper: HTML → DOMParser → Defuddle → sanitize → Result |
| `src/core/feeds/feed-service.js` | Calls `extractFullText()` after parsing, before storing |
| `vite.config.js` | `/api/page` proxy endpoint (reuses `proxyHandler()` from `/api/feed`) |

### Tests

| File | Coverage |
|------|----------|
| `tests/core/extractor/extractor.test.js` | 7 tests: needsExtraction heuristic (full content, empty, missing, identical, no link, non-HTTP, distinct short) |
| `tests/core/extractor/defuddle-extractor.test.js` | 6 tests: content extraction, nav/footer stripping, title extraction, XSS sanitization, empty input, non-HTML |
| `tests/core/feeds/feed-service.test.js` | 3 new tests: summary-only extraction, skip full-content feeds, graceful failure |

## Design Decisions

- **Auto-detect, don't always extract** — Feeds that provide full content (like Spyglass) already have excellent HTML. Running extraction over it would strip author-intended elements and degrade quality.
- **500-char threshold** — Articles with content shorter than 500 chars where content equals summary are treated as teasers. Genuinely short articles with distinct content are left alone.
- **Non-fatal extraction** — If page fetch or extraction fails, the article keeps its original summary. Adding a feed never fails due to extraction problems.
- **Pluggable architecture** — `extractor.js` imports from `defuddle-extractor.js`. Swapping to Readability means writing `readability-extractor.js` and changing one import line. Future: user-selectable per feed.
- **Separate proxy endpoint** — `/api/page` is distinct from `/api/feed` for clarity, though both use the same handler.

## Limitations

- Extraction quality depends on page structure — sites with heavy JavaScript rendering may produce poor results (Defuddle operates on static HTML)
- No per-feed toggle yet — auto-detect only (planned as future Option C)
- Sequential article fetching — could be parallelized for performance
- Dev-only proxy — production deployment needs a real server-side proxy for `/api/page`
