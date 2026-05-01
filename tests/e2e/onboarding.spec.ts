import { test, expect } from "@playwright/test";

test.describe("Onboarding", () => {
  test("new user auto-initializes and lands on All items article list", async ({
    page,
  }) => {
    // Clear localStorage so the app starts fresh, but suppress changelog dialog
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("feedzero:last-seen-version", "0.2.1");
    });
    await page.goto("/feeds");

    // App should auto-initialize and redirect to /feeds/all — the article
    // list, not the Explore catalog. Explore is reachable via the sidebar.
    await page.waitForURL(/\/feeds\/all/, { timeout: 15000 });
  });

  test("returning user skips onboarding and loads directly", async ({
    page,
  }) => {
    // Set onboarding as complete before navigating
    await page.addInitScript(() => {
      localStorage.setItem("feedzero:onboarding-complete", "true");
      localStorage.setItem("feedzero:storage-mode", "local");
      // Suppress changelog dialog
      localStorage.setItem("feedzero:last-seen-version", "0.2.1");
    });
    await page.goto("/feeds");

    // No dialog should appear
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });
    // App should load and land on the All items list
    await page.waitForURL(/\/feeds\/all/, { timeout: 15000 });
  });

  test("no onboarding modal appears for new users", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      // Suppress changelog dialog to isolate the onboarding test
      localStorage.setItem("feedzero:last-seen-version", "0.2.1");
    });
    await page.goto("/feeds");

    // Wait for app initialization
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading"),
      { timeout: 15000 },
    );

    // No dialog should be visible — auto-initialization is silent
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });

    // App should land on the article list rather than Explore
    await page.waitForURL(/\/feeds\/all/, { timeout: 15000 });
  });
});
