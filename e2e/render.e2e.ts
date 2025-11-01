import { expect, test } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] || "";

// Choose base URL: if PLAYWRIGHT_BASE_URL is set we treat this as a deployed run
test.describe("Render smoke", () => {
	test("app renders and shows heading", async ({ page }) => {
		// Navigate to root and wait for network idle (app may redirect)
		await page.goto(BASE_URL, {
			waitUntil: "networkidle",
		});

		// Allow some extra time for hydration/UI to render in dev mode
		await page.waitForTimeout(500);

		// Expect the main heading or any h2 to be visible
		const heading = page
			.locator("h1, h2, [data-testid='main-title'], main")
			.first();
		await expect(heading).toBeVisible({ timeout: 20000 });
	});
});
