import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { authenticateTestUser } from "../utils/auth-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_VIOLATIONS = 0;

test.describe("Accessibility", () => {
	test("home page has no accessibility violations", async ({ page }) => {
		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(results.violations).toHaveLength(NO_VIOLATIONS);
	});

	test("dashboard has no accessibility violations", async ({ page }) => {
		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(results.violations).toHaveLength(NO_VIOLATIONS);
	});

	test("song library has no accessibility violations", async ({ page }) => {
		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard/song-library`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(results.violations).toHaveLength(NO_VIOLATIONS);
	});

	test("typegpu demo has no accessibility violations", async ({ page }) => {
		await page.goto(`${BASE_URL}/en/typegpu-demo`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(results.violations).toHaveLength(NO_VIOLATIONS);
	});
});
