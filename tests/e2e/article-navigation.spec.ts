import { test, expect, addFeedViaUI, selectFeedInSidebar } from "./fixtures";
import { SAMPLE_RSS, mockFeedEndpoint } from "./feed-fixtures";

/**
 * Helper: adds a feed via the Explore page UI.
 */
async function addTestFeed(page: import("@playwright/test").Page) {
  await mockFeedEndpoint(page, SAMPLE_RSS);
  await addFeedViaUI(page, "https://example.com/feed");
}

/** Scoped selector for an article in the list (not the reader heading). */
function articleOption(page: import("@playwright/test").Page, text: string) {
  return page.locator('[role="option"]', { hasText: text });
}

test.describe("Article navigation", () => {
  test("select feed shows articles", async ({ feedPage: page }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");

    // Articles should appear in the list
    await expect(articleOption(page, "First Article")).toBeVisible({
      timeout: 10000,
    });
    await expect(articleOption(page, "Second Article")).toBeVisible();
  });

  test("select article shows reader content", async ({ feedPage: page }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");
    await expect(articleOption(page, "First Article")).toBeVisible({
      timeout: 10000,
    });

    // Click an article in the list
    await articleOption(page, "Second Article").click();

    // Reader should show the article content
    await expect(
      page.getByText("Brief summary of the second article"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("URL updates on feed selection", async ({ feedPage: page }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");

    // URL should contain /feeds/<feedId>
    await page.waitForURL(/\/feeds\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/feeds\/[a-zA-Z0-9_-]+/);
  });

  test("URL updates on article selection", async ({ feedPage: page }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");
    await expect(articleOption(page, "First Article")).toBeVisible({
      timeout: 10000,
    });

    await articleOption(page, "Second Article").click();

    // URL should contain /feeds/<feedId>/articles/<articleId>
    await page.waitForURL(/\/feeds\/[^/]+\/articles\/[a-zA-Z0-9_-]+/, {
      timeout: 10000,
    });
    expect(page.url()).toMatch(/\/feeds\/[^/]+\/articles\/[a-zA-Z0-9_-]+/);
  });

  test("auto-selects first article when navigating to feed (desktop only)", async ({
    feedPage: page,
  }, testInfo) => {
    // Auto-select is a desktop affordance: the 3-panel layout would otherwise
    // show an empty reader pane. On mobile the article list is the
    // destination, not a transient state.
    test.skip(
      testInfo.project.name === "mobile",
      "Mobile no longer auto-selects the first article",
    );

    await mockFeedEndpoint(page, SAMPLE_RSS);
    await addFeedViaUI(page, "https://example.com/feed");

    // After adding a feed, the app navigates to /feeds/{feedId}.
    // The first article should be auto-selected.
    await page.waitForURL(/\/feeds\/[^/]+\/articles\/[a-zA-Z0-9_-]+/, {
      timeout: 15000,
    });

    // First article content should be visible in reader
    await expect(page.getByText("Short description only.")).toBeVisible({
      timeout: 10000,
    });
  });

  test("unread articles are bold", async ({ feedPage: page }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");
    await expect(articleOption(page, "First Article")).toBeVisible({
      timeout: 10000,
    });

    // Unread articles should have font-medium class on their title
    const secondArticleItem = articleOption(page, "Second Article");
    await expect(secondArticleItem).toBeVisible();
    const titleEl = secondArticleItem.locator(".font-medium");
    await expect(titleEl).toBeVisible();
  });

  test("selecting article marks as read (removes bold)", async ({
    feedPage: page,
  }) => {
    await addTestFeed(page);
    await selectFeedInSidebar(page, "Test Feed");
    await expect(articleOption(page, "Second Article")).toBeVisible({
      timeout: 10000,
    });

    // Click second article — it should get marked as read
    await articleOption(page, "Second Article").click();

    // Wait for the read state to be applied
    await page.waitForTimeout(500);

    // The article title should no longer have font-medium (read articles use text-foreground/70)
    const secondArticleItem = articleOption(page, "Second Article");
    const boldTitle = secondArticleItem.locator(".font-medium");
    await expect(boldTitle).toHaveCount(0, { timeout: 5000 });
  });
});

test.describe("Article navigation — mobile", () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test("feed selection shows article list, then reader on tap", async ({
    feedPage: page,
  }) => {
    await mockFeedEndpoint(page, SAMPLE_RSS);
    await addFeedViaUI(page, "https://example.com/feed");

    // After adding via Explore, the app navigates to /feeds/{feedId}.
    await page.waitForURL(/\/feeds\//, { timeout: 10000 });

    // Open sidebar to select the feed
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click the feed — on mobile, this lands on the article list (no auto-select).
    await dialog
      .locator('[data-sidebar="menu-button"]', { hasText: "Test Feed" })
      .click();

    // Sidebar closes
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // Article list is visible; back pill is NOT (we're not in the reader yet)
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator('[data-testid="back-pill"]'),
    ).not.toBeVisible();

    // Tap an article to open the reader
    await page.locator('[role="option"]').first().click();
    await expect(page.getByText("Short description only.")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="back-pill"]')).toBeVisible();
  });

  test("navigating to /feeds lands on All items list (not explore)", async ({
    feedPage: page,
  }) => {
    // On mobile at /feeds with no feeds, app redirects to /feeds/all
    // (the All items article list). Explore is reachable via the sidebar.
    await page.waitForURL(/\/feeds\/all/, { timeout: 10000 });
  });
});
