import { defineConfig, devices } from "@playwright/test";

const CI = typeof process.env["CI"] === "string" && process.env["CI"] !== "";
const PLAYWRIGHT_BASE_URL =
	typeof process.env["PLAYWRIGHT_BASE_URL"] === "string" &&
	process.env["PLAYWRIGHT_BASE_URL"] !== ""
		? process.env["PLAYWRIGHT_BASE_URL"]
		: undefined;

// Named numeric constants to avoid magic numbers in config
const CI_RETRIES = 2;
const CI_WORKERS = 1;
const NO_RETRIES = 0;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_ACTION_TIMEOUT_MS = 15_000;
const DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000;
const FIREFOX_MAX_CONNECTIONS = 100;
const FIREFOX_MAX_CONNECTIONS_PER_SERVER = 10;
const WEBSERVER_TIMEOUT_MS = 180_000;

/* Compute a typed webServer config to satisfy lint rules. */
type PlaywrightWebServer = {
	command: string;
	url: string;
	reuseExistingServer?: boolean;
	timeout?: number;
	// Playwright's TestConfigWebServer expects stdout/stderr to be 'pipe' | 'ignore'
	stdout?: "pipe" | "ignore";
	stderr?: "pipe" | "ignore";
};

const computedWebServer: PlaywrightWebServer | undefined = (() => {
	if (PLAYWRIGHT_BASE_URL !== undefined) {
		return undefined;
	}
	if (CI) {
		return {
			// Ensure PLAYWRIGHT_BASE_URL is exported when Playwright spawns the
			// dev servers so the tests and any helper code reading
			// process.env.PLAYWRIGHT_BASE_URL will see the dev base URL and
			// not default back to the HTTPS fallback.
			command:
				"bash -lc 'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 bun ./scripts/playwright/playwright-start-dev.bun.ts'",
			url: "http://127.0.0.1:5173",
			reuseExistingServer: false,
			timeout: WEBSERVER_TIMEOUT_MS,
			stdout: "pipe",
			stderr: "pipe",
		} as PlaywrightWebServer;
	}
	// When Playwright auto-starts locally we prefer the compiled frontend via
	// `vite preview`, plus the local API dev server behind Vite's preview
	// proxy. This is closer to production and avoids flakiness from the
	// front-end dev server / HMR stack during local E2E runs.
	return {
		// Export PLAYWRIGHT_BASE_URL when starting the local preview stack so
		// the test code (which looks at process.env.PLAYWRIGHT_BASE_URL) uses
		// the same HTTPS URL the preview server serves.
		command:
			"bash -lc 'PLAYWRIGHT_BUILD_SCRIPT=build:client:staging PLAYWRIGHT_API_SCRIPT=dev:api:staging PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 bun ./scripts/playwright/playwright-start-preview.bun.ts'",
		url: "https://127.0.0.1:5173",
		reuseExistingServer: !CI,
		timeout: WEBSERVER_TIMEOUT_MS,
		stdout: "pipe",
		stderr: "pipe",
	} as PlaywrightWebServer;
})();

const computedBaseURL: string = (() => {
	if (PLAYWRIGHT_BASE_URL !== undefined) {
		return PLAYWRIGHT_BASE_URL;
	}
	if (CI) {
		return "http://127.0.0.1:5173";
	}
	// When computedWebServer is defined Playwright will auto-start the local
	// preview server and proxy /api to the local API server.
	if (computedWebServer) {
		return "https://127.0.0.1:5173";
	}
	return "https://localhost:5173";
})();

// Ensure the Playwright test runner process sees the computed base URL so
// tests that read process.env.PLAYWRIGHT_BASE_URL (our test helpers) will
// use the same URL the webServer will start at when auto-starting.
if (process.env["PLAYWRIGHT_BASE_URL"] === undefined) {
	process.env["PLAYWRIGHT_BASE_URL"] = computedBaseURL;
}

export default defineConfig({
	testDir: "./e2e",
	testMatch: ["**/*.e2e.ts", "**/*.e2e.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? CI_RETRIES : NO_RETRIES,
	...(CI ? { workers: CI_WORKERS } : {}),
	reporter: "html",
	// Increased to 60 seconds for service worker tests
	timeout: DEFAULT_TIMEOUT_MS,
	use: {
		// Tests target a deployed URL when PLAYWRIGHT_BASE_URL is set.
		// For local manual browsing we often use HTTPS, and ignore self-signed
		// TLS errors in the browser. However when Playwright auto-starts the
		// local preview stack it runs over HTTPS. Use that baseURL in this case to keep browser
		// navigation in sync with the launched server.
		baseURL: computedBaseURL,
		ignoreHTTPSErrors: true,
		trace: "on-first-retry",
		// Increased for more reliable dev server testing
		actionTimeout: DEFAULT_ACTION_TIMEOUT_MS,
		// Increased to handle slower dev server response times
		navigationTimeout: DEFAULT_NAVIGATION_TIMEOUT_MS,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				ignoreHTTPSErrors: true,
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
			// WebGPU / TypeGPU requires GPU support; the default chromium project disables it.
			// Keep this project scoped to the TypeGPU demo spec.
			name: "chromium-webgpu",
			testMatch: ["e2e/typegpu-demo.spec.ts"],
			use: {
				...devices["Desktop Chrome"],
				ignoreHTTPSErrors: true,
				launchOptions: {
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
						"--disable-extensions",
						"--disable-web-security",
						"--no-first-run",
						"--no-default-browser-check",
						"--disable-default-apps",
						"--disable-background-networking",
						"--disable-sync",
						"--disable-component-update",
						"--remote-debugging-port=0",
						// Enable WebGPU in automated Chromium runs.
						"--enable-unsafe-webgpu",
						"--enable-features=WebGPU",
					],
				},
			},
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				ignoreHTTPSErrors: true,
				// Firefox-specific launch options for better reliability
				launchOptions: {
					firefoxUserPrefs: {
						"dom.webnotifications.enabled": false,
						"media.navigator.permission.disabled": true,
						// Improve performance and reliability
						"network.http.max-connections": FIREFOX_MAX_CONNECTIONS,
						"network.http.max-connections-per-server": FIREFOX_MAX_CONNECTIONS_PER_SERVER,
						"browser.startup.homepage_override.mstone": "ignore",
						"browser.usedOnWindows10.introURL": "",
						"startup.homepage_welcome_url": "",
						"startup.homepage_welcome_url.additional": "",
					},
				},
				// Increased timeouts for Firefox
				// 1. More generous timeout for Firefox
				actionTimeout: 25_000,
				// 2. More generous timeout for Firefox
				navigationTimeout: DEFAULT_NAVIGATION_TIMEOUT_MS,
			},
		},
		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
			},
		},
	],
	// Automatically start the local preview stack for E2E tests
	// For preview server tests, use: PLAYWRIGHT_BASE_URL=http://localhost:8787 playwright test
	// For deployed tests, use: PLAYWRIGHT_BASE_URL=https://your-domain.com playwright test
	// When PLAYWRIGHT_BASE_URL is not set, use the local preview wrapper so
	// Playwright owns the compiled frontend and API lifecycle without detached
	// background processes. Choose a webServer config below. We compute it in
	// a typed variable
	// before passing to defineConfig so ESLint/TS rules are satisfied.
	...(computedWebServer === undefined ? {} : { webServer: computedWebServer }),
});

// (webServer set above via computedWebServer)
