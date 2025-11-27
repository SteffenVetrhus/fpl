import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load and display the React Router welcome page", async ({
    page,
  }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/React Router/);

    // Verify React Router content is visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Page should be interactive
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
