#!/usr/bin/env bun
/**
 * Test script to verify Playwright auth bypass setup
 *
 * Run: npm run test:auth-bypass
 *
 * This script validates that the auth bypass configuration works correctly.
 */

/* eslint-disable no-console */

import { chromium } from "@playwright/test";

import extractErrorMessage from "../shared/src/error-message/extractErrorMessage";

const mockUserSession = {
	user: {
		user_id: "test-user-id-123",
		email: "test-debug@example.com",
		name: "Test Debug User",
		username: "testuser",
	},
};

async function testAuthBypass(): Promise<void> {
	console.log("🧪 Testing Playwright auth bypass setup...\n");

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		ignoreHTTPSErrors: true, // Accept self-signed certs for localhost
	});
	const page = await context.newPage();

	// Set up the same route handler as the E2E tests
	let interceptCount = 0;
	await page.route("**/api/me", async (route) => {
		interceptCount++;
		console.log(`✅ Intercepted /api/me request #${interceptCount}`);
		console.log("   Request URL:", route.request().url());
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(mockUserSession),
		});
	});

	try {
		// Navigate to local development server (HTTPS) with i18n path
		console.log("📍 Navigating to https://localhost:5173/en/dashboard");
		await page.goto("https://localhost:5173/en/dashboard", {
			waitUntil: "networkidle",
		});

		// Wait a moment for the page to load
		const WAIT_TIME = 2000;
		await page.waitForTimeout(WAIT_TIME);

		// Get the actual URL we ended up at
		const currentUrl = page.url();
		console.log(`\n🔍 Current URL: ${currentUrl}`);

		// Get the page title
		const title = await page.title();
		console.log(`📄 Page Title: ${title}`);

		// Check if we can see user data on the page
		const pageContent = await page.content();

		// Look for common dashboard indicators
		const hasDashboardText = pageContent.toLowerCase().includes("dashboard");
		const hasHomeText =
			pageContent.toLowerCase().includes("home") && pageContent.toLowerCase().includes("welcome");
		const hasUserData = pageContent.includes("Test Debug User") || pageContent.includes("testuser");

		console.log("\n📊 Test Results:");
		console.log("─────────────────────────────────────────────────");
		console.log(`🔢 Route intercepts: ${interceptCount} /api/me request(s) intercepted`);

		if (currentUrl.includes("/dashboard")) {
			console.log("✅ URL: Successfully stayed on /dashboard route");
		} else {
			console.log(`⚠️  URL: Redirected to ${currentUrl} (not /dashboard)`);
		}

		if (hasDashboardText) {
			console.log('✅ Content: Found "dashboard" text on page');
		} else if (hasHomeText) {
			console.log("❌ Content: Page shows home/welcome content (not dashboard)");
		} else {
			console.log("⚠️  Content: Could not determine page type");
		}

		if (hasUserData) {
			console.log("✅ Auth: User data appeared on the page!");
			console.log("   The auth bypass is working correctly.");
		} else {
			console.log("⚠️  Auth: Could not find user data on page.");
		}

		// Check for authentication redirects
		const bodyText = await page.textContent("body");
		if (
			typeof bodyText === "string" &&
			bodyText !== "" &&
			(bodyText.toLowerCase().includes("sign in") || bodyText.toLowerCase().includes("login"))
		) {
			console.log("❌ May need authentication: Found sign-in/login text");
		}

		console.log("\n💡 The browser will stay open for 30 seconds so you can inspect it.");
		console.log("   Press Ctrl+C to close immediately.");

		const INSPECT_TIME = 30_000;
		await page.waitForTimeout(INSPECT_TIME);
	} catch (error) {
		const errorMessage = extractErrorMessage(error, "Unknown error");
		console.error("\n❌ ERROR:", errorMessage);
		console.log("\n💡 Troubleshooting:");
		console.log("   1. Make sure the dev server is running: npm run dev");
		console.log("   2. Check that https://localhost:5173 is accessible");
		console.log("   3. Verify Playwright is installed: npm install --save-dev @playwright/test");
	} finally {
		await browser.close();
		console.log("\n✨ Test complete!");
	}
}

// Run the test
await testAuthBypass();
