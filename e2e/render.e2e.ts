import { test, expect } from "@playwright/test";
import { DEV_URL, PROD_URL, IS_DEPLOYED_TEST } from "./ports";

// Choose base URL: if PLAYWRIGHT_BASE_URL is set we treat this as a deployed run
const BASE_URL = IS_DEPLOYED_TEST ? PROD_URL : DEV_URL;

test.describe("Render smoke", () => {
	test("app renders and shows heading", async ({ page }) => {
 		// Navigate to root and wait for network idle (app may redirect)
 		await page.goto(BASE_URL, { waitUntil: "networkidle" });

 		// Allow some extra time for hydration/UI to render in dev mode
 		await page.waitForTimeout(500);

 		// Expect the main heading or any h2 to be visible
 		const heading = page.locator("h1, h2, [data-testid='main-title'], main").first();
 		await expect(heading).toBeVisible({ timeout: 20000 });
 	});
});
