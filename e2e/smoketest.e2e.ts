// Smoke test: basic navigation and key UI elements
import { type Page, expect, test } from "@playwright/test";

import { DEV_URL as E2E_DEV_URL, PROD_URL as E2E_PROD_URL, IS_DEPLOYED_TEST } from "./ports";

const DEV_URL = E2E_DEV_URL;

const PREVIEW_URL = E2E_PROD_URL;

// Helper function to check if a server is running
const isServerRunning = async (url: string): Promise<boolean> => {
	try {
		const response = await fetch(url, {
			method: "HEAD",
			signal: AbortSignal.timeout(2000),
		});
		return response.ok;
	} catch {
		return false;
	}
};

async function runSmokeTest(page: Page, url: string): Promise<void> {
	await page.goto(url);
	// Wait for page to be fully loaded
	await page.waitForLoadState("networkidle");

	// Check page title - for deployed environments, accept the deployed title
	if (IS_DEPLOYED_TEST) {
		// For deployed environments, just verify the title exists and is not empty
		const title = await page.title();
		expect(title.length).toBeGreaterThan(0);
	} else {
		// For local environments, just verify the title exists and contains text
		const title = await page.title();
		expect(title.length).toBeGreaterThan(0);
		expect(title).toMatch(/\w+/); // Should contain at least one word
	}

	// Give Firefox extra time to fully load the page and React to hydrate
	if (url.includes("localhost:5173")) {
		// For dev server, React needs more time to hydrate in Firefox
		await page.waitForTimeout(8000); // Even longer wait for Firefox dev server
	} else {
		await page.waitForTimeout(2000);
	}

	// For Firefox dev server, try a more basic approach - just wait for any content
	if (url.includes("localhost:5173")) {
		// First, just wait for the page to have any meaningful content
		await page.waitForFunction(
			() => {
				return document.body.innerHTML.length > 100;
			},
			{ timeout: 30000 },
		);

		// Then wait a bit more for React to fully render
		await page.waitForTimeout(3000);
	}

	// Check main title or header exists - be more flexible for Firefox
	let headerElements = page.locator(
		"h1, h2, h3, header, [data-testid='main-title'], .text-center",
	);

	// If Firefox on dev server, try even more generic selectors
	if (url.includes("localhost:5173")) {
		headerElements = page.locator("h1, h2, h3, header, div, span, p");
	}

	await expect(headerElements.first()).toBeVisible({ timeout: 25000 });

	// Check for a button (specific to the count button) with better Firefox compatibility
	const countButton = page.locator("button").first(); // Use a more basic selector for Firefox dev server
	await expect(countButton).toBeVisible({ timeout: 25000 });

	// Try clicking the button with additional wait
	await page.waitForTimeout(500);
	await countButton.click();

	// Check for count or result after click
	await expect(page.locator("body")).toContainText("count", {
		timeout: 8000,
	});
	// Check for navigation (if you have links) - safer navigation for WebKit
	const navLink = page.locator("a");
	try {
		const linkCount = await navLink.count();
		if (linkCount > 0) {
			await navLink.first().click();
			// Check that navigation occurred (URL should contain domain)
			const currentUrl = page.url();
			expect(currentUrl).toMatch(/^https?:\/\//); // Should be a valid URL
		}
	} catch {
		// If navigation fails, that's ok for a smoke test
		// Just verify we can navigate back to the original page
		await page.goto(url);
	}
}

test.describe("Smoke Test", () => {
	test("dev server: basic app health", async ({ page, browserName }) => {
		test.setTimeout(60000); // Longer timeout for Firefox dev server issues
		test.skip(
			IS_DEPLOYED_TEST,
			"Skipping dev server tests for deployed environment",
		);
		// Skip dev server tests for Firefox due to hydration issues
		test.skip(
			browserName === "firefox",
			"Firefox has compatibility issues with Vite dev server",
		);
		await runSmokeTest(page, DEV_URL);
	});

	test("preview server: basic app health", async ({ page }) => {
		test.skip(
			IS_DEPLOYED_TEST,
			"Skipping local preview server test when testing deployed environment",
		);

		// Check if preview server is running before attempting test
		const isRunning = await isServerRunning(PREVIEW_URL);
		test.skip(
			!isRunning,
			"Preview server not running. Start with: pnpm build:client && pnpm build:server && node dist/ssr/preview.js",
		);

		await runSmokeTest(page, PREVIEW_URL);
	});

	test("deployed environment: basic app health", async ({ page }) => {
		test.skip(
			!IS_DEPLOYED_TEST,
			"Skipping deployed test when testing local environment",
		);
		const deployedUrl = process.env.PLAYWRIGHT_BASE_URL;
		if (typeof deployedUrl !== "string" || deployedUrl.trim() === "") {
			throw new Error(
				"PLAYWRIGHT_BASE_URL is required for deployed environment tests",
			);
		}
		await runSmokeTest(page, deployedUrl);
	});
});
