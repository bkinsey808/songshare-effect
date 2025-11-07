import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	testMatch: ["**/*.e2e.ts", "**/*.e2e.tsx"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	// Increased to 60 seconds for service worker tests
	timeout: 60000,
	use: {
		// Tests target a deployed URL when PLAYWRIGHT_BASE_URL is set.
		// For local dev we need to use HTTPS (Vite serves HTTPS by default),
		// and ignore self-signed TLS errors in the browser.
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://localhost:5173",
		ignoreHTTPSErrors: true,
		trace: "on-first-retry",
		// Increased for more reliable dev server testing
		actionTimeout: 15000,
		// Increased to handle slower dev server response times
		navigationTimeout: 30000,
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
	// Auto-start disabled: prefer explicit server start to avoid flaky
	// environment-dependent behavior when Playwright attempts to manage
	// backgrounded dev servers. When running tests locally, start the dev
	// servers first (see README or package.json scripts) and then set
	// PLAYWRIGHT_BASE_URL to point at the running server.
	// Automatically start dev server for E2E tests when PLAYWRIGHT_BASE_URL
	// is not set. We use the foreground `npm run dev:all` command so Playwright
	// spawns the dev servers directly (no background processes/nohup). This keeps the
	// processes in the same process tree Playwright controls and avoids races
	// caused by detached background processes.
	webServer:
		process.env?.["PLAYWRIGHT_BASE_URL"] === undefined
			? {
					command: "npm run dev:all",
					// Use 127.0.0.1 to avoid hostname/IPv6 resolution differences
					url: "https://127.0.0.1:5173",
					reuseExistingServer: !process.env.CI,
					// Allow longer startup on slower machines
					timeout: 180000,
					stdout: "pipe",
					stderr: "pipe",
				}
			: undefined,
});
