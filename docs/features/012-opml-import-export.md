# Feature 012: OPML Import/Export

## Status
Implemented

## Summary

Import and export feed subscriptions using the OPML standard format. Users can import feeds via file upload or pasted text (OPML or plain URL list), and export their subscriptions as OPML file download or copied URL list. This enables migration to/from other feed readers and backup of subscriptions.

## Behaviour

```gherkin
Feature: OPML Import/Export

  Scenario: Import feeds from OPML file
    Given the user has an OPML file with feed subscriptions
    When the user opens Settings, selects Import, uploads the file
    Then the app parses the OPML and imports each feed URL
    And shows progress during import
    And displays a summary of successful/failed imports

  Scenario: Import feeds from pasted OPML text
    Given the user has OPML XML content copied
    When the user opens Settings, selects Import > Text, pastes the OPML
    And clicks "Import feeds"
    Then the app detects OPML format and imports the feeds

  Scenario: Import feeds from pasted URL list
    Given the user has a list of feed URLs (one per line)
    When the user opens Settings, selects Import > Text, pastes the URLs
    And clicks "Import feeds"
    Then the app parses each URL and imports the feeds

  Scenario: Export feeds as OPML file
    Given the user has feeds subscribed
    When the user opens Settings, selects Export
    And clicks "Download OPML"
    Then the browser downloads an OPML file with all subscriptions

  Scenario: Export feeds as URL list
    Given the user has feeds subscribed
    When the user opens Settings, selects Export
    And clicks the copy button on the URL list
    Then the URLs are copied to clipboard

  Scenario: Import with partial failures
    Given the user imports 5 feeds
    And 3 succeed and 2 fail (network error, invalid feed)
    Then the results view shows "3 feeds added, 2 failed"
    And lists the failures with error messages
```

## Architecture

### Flow

**Import Flow:**
1. User opens Settings dialog via gear icon in sidebar footer
2. User selects Import view and chooses File or Text input mode
3. User provides OPML file or pastes text (OPML or URL list)
4. `isOpmlFormat()` detects format, routes to appropriate parser
5. `parseOpmlFile()` or `parseUrlList()` extracts feed URLs
6. Import store transitions to `importing` status
7. For each URL, `addFeed()` is called sequentially
8. Results are recorded (success/failure with error)
9. Import store transitions to `complete`, showing results
10. User clicks "Done" to close or "Import more" to reset

**Export Flow:**
1. User opens Settings dialog, selects Export view
2. `generateOpmlFile()` creates OPML XML from feeds
3. `generateUrlList()` creates newline-separated URL text
4. OPML Download: creates Blob, triggers download as `.opml` file
5. URL Copy: copies text to clipboard via `navigator.clipboard`

### Files

| File | Role |
|------|------|
| `src/core/opml/opml-service.ts` | OPML parsing and generation using feedsmith |
| `src/core/opml/url-list-parser.ts` | Plain text URL list parsing with validation |
| `src/stores/import-store.ts` | State machine for import progress tracking |
| `src/components/settings/settings-dialog.tsx` | Main settings dialog container |
| `src/components/settings/import-view.tsx` | Import UI with file/text toggle |
| `src/components/settings/export-view.tsx` | Export UI with download/copy |
| `src/components/settings/import-progress.tsx` | Progress bar during import |
| `src/components/settings/import-results.tsx` | Success/failure summary |
| `src/components/layout/app-sidebar.tsx` | Settings button integration |

### Tests

| File | Coverage |
|------|----------|
| `tests/core/opml/opml-service.test.ts` | OPML parse/generate, nested folders, edge cases |
| `tests/core/opml/url-list-parser.test.ts` | URL parsing, comments, dedup, format detection |
| `tests/stores/import-store.test.ts` | State machine, selectors, progress tracking |
| `tests/e2e/import-export.spec.ts` | Full import/export flows in browser |

## Design Decisions

- **feedsmith library** — Uses feedsmith for all OPML parsing/generation. Same library now handles RSS/Atom/JSON Feed parsing, providing consistency and reducing dependencies.

- **Flatten nested folders** — OPML supports nested folder structure. For v1, folders are flattened and only feed entries (outlines with `xmlUrl`) are extracted. Folder organization can be added later.

- **Sequential import** — Feeds are imported one at a time rather than in parallel. This provides clear progress feedback and avoids overwhelming the API proxy with concurrent requests.

- **Text export format** — Export as plain URLs (one per line) rather than titles or other metadata. This is the most portable format for pasting into other tools.

- **Access via Add Feed popover** — Import/Export is accessed from the "+" (Add Feed) button in the sidebar header, with an "or Import / Export OPML" option. This keeps feed-related actions together and avoids cluttering the footer.

- **Auto-detect format** — When pasting text, the app auto-detects whether it's OPML XML or a plain URL list by checking for XML markers, eliminating the need for users to specify format.

- **URL normalization** — URLs without protocol are auto-prefixed with `https://`. Invalid URLs are silently filtered rather than failing the entire import.

## Limitations

- File upload is limited to `.opml` and `.xml` extensions
- No folder/category support in v1 (all feeds are flat)
- No import progress cancellation (once started, all URLs are processed)
- Duplicate detection is handled by the existing `addFeed` flow, not pre-filtered
