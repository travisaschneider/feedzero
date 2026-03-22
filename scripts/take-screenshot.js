import { chromium } from "playwright";

const APP_URL = "http://localhost:3000";
const OUTPUT = "feedzero-screenshot.png";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Bypass onboarding via localStorage before navigating
  await page.goto(APP_URL);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto(APP_URL);
  await page.waitForTimeout(1000);

  // Complete onboarding
  console.log("Completing onboarding...");

  // Step 1: Get Started
  await page.getByRole("button", { name: /get started/i }).click();
  await page.waitForTimeout(500);

  // Step 2: Select Local only (click the radio, then continue)
  await page.keyboard.press("1"); // Keyboard shortcut to select local
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter"); // Continue
  await page.waitForTimeout(3000); // Wait for DB initialization

  // Wait for the app to fully load
  console.log("Waiting for app to load...");
  await page.waitForSelector('[data-sidebar="menu-button"]', { timeout: 10000 }).catch(() => {
    console.log("No sidebar menu buttons yet, adding feeds...");
  });

  // Add a starter pack
  console.log("Adding World News starter pack...");
  const addAllBtns = page.getByRole("button", { name: /add all/i });
  if (await addAllBtns.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await addAllBtns.first().click();
    console.log("Waiting for feeds to load (this takes ~20s)...");
    await page.waitForTimeout(25000);
  }

  // Reload to ensure sidebar shows feeds
  await page.reload();
  await page.waitForTimeout(3000);

  // Click a specific feed (not "All")
  console.log("Selecting a feed...");
  const menuButtons = page.locator('[data-sidebar="menu-button"]');
  const btnCount = await menuButtons.count();
  console.log(`Found ${btnCount} sidebar buttons`);
  if (btnCount > 1) {
    await menuButtons.nth(1).click();
    await page.waitForTimeout(2000);
  }

  // Click the first article
  console.log("Selecting an article...");
  const articles = page.locator('[role="option"]');
  const artCount = await articles.count();
  console.log(`Found ${artCount} articles`);
  if (artCount > 0) {
    await articles.first().click();
    await page.waitForTimeout(2000);
  }

  // Take screenshot
  await page.screenshot({ path: OUTPUT, type: "png" });
  console.log(`Screenshot saved to ${OUTPUT}`);

  await browser.close();
}

main().catch((e) => {
  console.error("Screenshot failed:", e.message);
  process.exit(1);
});
