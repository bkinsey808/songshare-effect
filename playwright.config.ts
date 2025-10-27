import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./specs",
	testMatch: ["**/*.e2e.ts", "**/*.e2e.tsx"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	// Increased to 60 seconds for service worker tests
	timeout: 60000,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
		trace: "on-first-retry",
		// Reduced from 15 seconds
		actionTimeout: 10000,
		// Reduced from 30 seconds for faster page loads
		navigationTimeout: 15000,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Minimal browser launch options for faster startup
				launchOptions: {
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
						"--disable-extensions",
						"--disable-gpu",
						"--disable-web-security",
						"--no-first-run",
						"--no-default-browser-check",
						"--disable-default-apps",
						"--disable-background-networking",
						"--disable-sync",
						"--disable-component-update",
						"--remote-debugging-port=0",
					],
				},
			},
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				// Firefox-specific launch options for better reliability
				launchOptions: {
					firefoxUserPrefs: {
						"dom.webnotifications.enabled": false,
						"media.navigator.permission.disabled": true,
						// Improve performance and reliability
						"network.http.max-connections": 100,
						"network.http.max-connections-per-server": 10,
						"browser.startup.homepage_override.mstone": "ignore",
						"browser.usedOnWindows10.introURL": "",
						"startup.homepage_welcome_url": "",
						"startup.homepage_welcome_url.additional": "",
					},
				},
				// Increased timeouts for Firefox
				// 1. More generous timeout for Firefox
				actionTimeout: 25000,
				// 2. More generous timeout for Firefox
				navigationTimeout: 30000,
			},
		},
		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
			},
		},
	],
	// Automatically start dev server for E2E tests
	// For preview server tests, use: PLAYWRIGHT_BASE_URL=http://localhost:8787 playwright test
	// For deployed tests, use: PLAYWRIGHT_BASE_URL=https://your-domain.com playwright test
	// Auto-start the local dev server when PLAYWRIGHT_BASE_URL is not set.
	// If PLAYWRIGHT_BASE_URL is provided we assume tests target a deployed URL
	// and therefore do not start a local server.
	webServer:
		process.env?.["PLAYWRIGHT_BASE_URL"] === undefined
			? {
				// Use a small wrapper so Playwright can start both frontend + API
				// in a non-interactive way. The wrapper will background the
				// underlying processes and wait on them.
				command: "./scripts/playwright-start-dev.sh",
				url: "http://localhost:5173",
				reuseExistingServer: !process.env.CI,
				// 2 minutes for server startup
				timeout: 120000,
				stdout: "pipe",
				stderr: "pipe",
			}
			: undefined,
});
