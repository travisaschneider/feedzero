import { test, expect } from "./fixtures";
import { SAMPLE_RSS, mockFeedEndpoint } from "./feed-fixtures";

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
  await expect(
    page.locator('[role="option"]', { hasText: "First Article" }),
  ).toBeVisible({ timeout: 10000 });
}

function breadcrumb(page: import("@playwright/test").Page) {
  return page.locator("nav[aria-label='breadcrumb']").first();
}

test.describe("Breadcrumbs", () => {
  test("shows feed title in breadcrumbs when feed is selected", async ({
    feedPage: page,
  }) => {
    await setupFeed(page);

    await expect(breadcrumb(page).getByText("Test Feed")).toBeVisible();
  });

  test("shows article title in breadcrumbs when article is selected", async ({
    feedPage: page,
  }) => {
    await setupFeed(page);

    await page.locator('[role="option"]', { hasText: "First Article" }).click();
    await expect(
      page.getByRole("heading", { name: "First Article" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(breadcrumb(page).getByText("Test Feed")).toBeVisible();
    await expect(breadcrumb(page).getByText("First Article")).toBeVisible();
  });

  test("feed breadcrumb link navigates back to feed", async ({
    feedPage: page,
  }) => {
    await setupFeed(page);

    await page
      .locator('[role="option"]', { hasText: "Second Article" })
      .click();
    await expect(
      page.getByText("Brief summary of the second article"),
    ).toBeVisible({ timeout: 10000 });

    // Click feed name in breadcrumb to go back
    await breadcrumb(page).getByText("Test Feed").click();

    await expect(page).toHaveURL(/\/feeds\/[^/]+/);
  });
});
