/**
 * Playwright example spec
 * - Demonstrates using BASE_URL and HYDRATION_WAIT_MS as used in repo tests
 * - Use auth helpers (e.g., authenticateTestUser) from `e2e/utils` for auth flows
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env?.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const HYDRATION_WAIT_MS = 2000;

test("home page shows sign in link", async ({ page }) => {
	await page.goto(`${BASE_URL}/en/`);
	await page.waitForTimeout(HYDRATION_WAIT_MS);

	await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});
