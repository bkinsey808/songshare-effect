import { defineConfig, devices } from "@playwright/test";

const CI = typeof process.env.CI === "string" && process.env.CI !== "";
const PLAYWRIGHT_BASE_URL =
	typeof process.env.PLAYWRIGHT_BASE_URL === "string" && process.env.PLAYWRIGHT_BASE_URL !== ""
		? process.env.PLAYWRIGHT_BASE_URL
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
			// process.env.PLAYWRIGHT_BASE_URL will see the HTTP base URL and
			// not default back to the HTTPS fallback.
			command: "bash -lc 'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 bun ./scripts/playwright/playwright-start-dev.bun.ts'",
			url: "http://127.0.0.1:5173",
			reuseExistingServer: false,
			timeout: WEBSERVER_TIMEOUT_MS,
			stdout: "pipe",
			stderr: "pipe",
		} as PlaywrightWebServer;
	}
	// When Playwright auto-starts local dev servers we prefer to run the
	// frontend over plain HTTP so the Node readiness probe does not fail on
	// self-signed certs. We set PLAYWRIGHT_DISABLE_HTTPS=1 in the command so
	// Vite serves over HTTP and the webServer.url uses http://127.0.0.1:5173
	// which is a stable loopback address Playwright can probe reliably.
	return {
		// Export PLAYWRIGHT_BASE_URL when starting the dev servers so the
		// test code (which looks at process.env.PLAYWRIGHT_BASE_URL) will
		// use the same HTTP URL the auto-started server uses.
		command: "bash -lc 'PLAYWRIGHT_DISABLE_HTTPS=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run dev:all'",
		url: "http://127.0.0.1:5173",
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
	// When computedWebServer is defined Playwright will auto-start local
	// dev servers and we prefer a plain HTTP base URL so node probes succeed
	// against a non-HTTPS server.
	if (computedWebServer) {
		return "http://127.0.0.1:5173";
	}
	return "https://localhost:5173";
})();

// Ensure the Playwright test runner process sees the computed base URL so
// tests that read process.env.PLAYWRIGHT_BASE_URL (our test helpers) will
// use the same URL the webServer will start at (HTTP when auto-starting).
if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
	process.env.PLAYWRIGHT_BASE_URL = computedBaseURL;
}

export default defineConfig({
	testDir: "./e2e",
	testMatch: ["**/*.e2e.ts", "**/*.e2e.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? CI_RETRIES : NO_RETRIES,
	workers: CI ? CI_WORKERS : undefined,
	reporter: "html",
	// Increased to 60 seconds for service worker tests
	timeout: DEFAULT_TIMEOUT_MS,
	use: {
		// Tests target a deployed URL when PLAYWRIGHT_BASE_URL is set.
		// For local dev we usually use HTTPS (Vite serves HTTPS by default),
		// and ignore self-signed TLS errors in the browser. However when
		// Playwright auto-starts the dev servers (webServer configured) it will
		// run the frontend over HTTP so the Node reachability probe succeeds
		// (self-signed certs are rejected by Node). Use the HTTP baseURL in
		// that case to keep browser navigation in sync with the launched server.
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
	// Prefer a non-interactive, logging-friendly wrapper when running in CI.
	// Local development keeps using `npm run dev:all` (foreground) which works
	// well with dev certificates and local HTTPS flows.
	// Choose a webServer config below. We compute it in a typed variable
	// before passing to defineConfig so ESLint/TS rules are satisfied.
	webServer: computedWebServer,
});

// (webServer set above via computedWebServer)
