import { test, expect } from "@playwright/test";
import { skipOnboarding, addFeedViaUI } from "./fixtures";
import { SAMPLE_RSS, mockFeedEndpoint } from "./feed-fixtures";

/**
 * Mobile navigation tests: scroll-snap panels with a floating back pill.
 *
 * On mobile, the article list and reader are adjacent scroll-snap panels.
 * Selecting an article scrolls to the reader panel. A floating pill at the
 * bottom scrolls back to the article list. Swiping right (native scroll-
 * snap) also navigates back.
 *
 * These tests only run on the mobile viewport.
 */
test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 393, height: 851 } }); // Pixel 5

  test("article list and reader both exist in the DOM when viewing an article", async ({
    page,
  }) => {
    // On mobile with scroll-snap, BOTH panels are in the DOM simultaneously
    // (not conditionally rendered based on URL). The scroll position
    // determines which panel is visible; both must exist for snap to work.
    await skipOnboarding(page);
    await mockFeedEndpoint(page, SAMPLE_RSS);
    await addFeedViaUI(page, "https://example.com/feed");

    // The app auto-selects the first article after adding a feed.
    // Wait for the reader content to appear.
    await expect(
      page.locator("article").first(),
    ).toBeVisible({ timeout: 10000 });

    // The article list (listbox) must ALSO be in the DOM, even though
    // the reader is the visible snap panel.
    await expect(
      page.locator('[role="listbox"]'),
    ).toBeAttached({ timeout: 5000 });
  });

  test("floating back pill appears when viewing an article", async ({
    page,
  }) => {
    await skipOnboarding(page);
    await mockFeedEndpoint(page, SAMPLE_RSS);
    await addFeedViaUI(page, "https://example.com/feed");

    // Wait for reader content
    await expect(
      page.locator("article").first(),
    ).toBeVisible({ timeout: 10000 });

    // The floating pill is a sticky/fixed element at the bottom,
    // distinct from the old inline "← Back" button that lived in the
    // main content flow.
    const backPill = page.locator('[data-testid="back-pill"]');
    await expect(backPill).toBeVisible({ timeout: 5000 });
  });
});
