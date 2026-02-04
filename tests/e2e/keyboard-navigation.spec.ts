import { test, expect } from "./fixtures";
import { SAMPLE_RSS, mockFeedEndpoint } from "./feed-fixtures";

/** Scoped selector for an article in the list. */
function articleOption(page: import("@playwright/test").Page, text: string) {
  return page.locator('[role="option"]', { hasText: text });
}

/** Adds a feed, selects it, and waits for articles to load. */
async function setupFeed(page: import("@playwright/test").Page) {
  await mockFeedEndpoint(page, SAMPLE_RSS);
  await page.getByRole("button", { name: "Add feed" }).click();
  await page
    .getByPlaceholder("Feed or site URL")
    .fill("https://example.com/feed");
  await page.getByRole("button", { name: "Add" }).click();
  const sidebarFeed = page.getByRole("button", { name: "Test Feed" });
  await expect(sidebarFeed).toBeVisible({ timeout: 10000 });
  await sidebarFeed.click();
  await expect(articleOption(page, "First Article")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Keyboard navigation", () => {
  test("j opens next article", async ({ feedPage: page }) => {
    await setupFeed(page);

    // First article is auto-selected, reader shows it
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });

    // Press j to open next article
    await page.keyboard.press("j");

    // Reader should show the second article content
    await expect(
      page.getByText("Brief summary of the second article"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("k opens previous article", async ({ feedPage: page }) => {
    await setupFeed(page);

    // First article is auto-selected
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });

    // Press j to go to second article
    await page.keyboard.press("j");
    await expect(
      page.getByText("Brief summary of the second article"),
    ).toBeVisible({ timeout: 10000 });

    // Press k to go back to first article
    await page.keyboard.press("k");

    // Reader should show the first article again
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("keys are ignored in input fields", async ({ feedPage: page }) => {
    await setupFeed(page);

    // Open add feed form
    await page.getByRole("button", { name: "Add feed" }).click();
    const input = page.getByPlaceholder("Feed or site URL");
    await input.focus();

    // Type 'j' — should go into input, not navigate articles
    await page.keyboard.press("j");
    await expect(input).toHaveValue("j");
  });

  test("j/k stay at boundaries", async ({ feedPage: page }) => {
    await setupFeed(page);

    // First article is auto-selected
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });

    // Press k — should stay at first (can't go before first)
    await page.keyboard.press("k");

    // Should still show first article
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("o opens original link in new tab", async ({ feedPage: page }) => {
    await setupFeed(page);

    // Select an article first
    await articleOption(page, "First Article").click();
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });

    // Press o — should open the original link
    const popupPromise = page.waitForEvent("popup");
    await page.keyboard.press("o");
    const popup = await popupPromise;
    expect(popup.url()).toContain("example.com/first");
  });

  test("n opens add feed form", async ({ feedPage: page }) => {
    await setupFeed(page);

    // Ensure add form is not open
    await expect(page.getByPlaceholder("Feed or site URL")).not.toBeVisible();

    // Press n
    await page.keyboard.press("n");

    // Add form should be open
    await expect(page.getByPlaceholder("Feed or site URL")).toBeVisible({
      timeout: 5000,
    });
  });
});
