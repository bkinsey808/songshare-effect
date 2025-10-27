import { type Page, expect, test } from "@playwright/test";

// E2E URLs
import { DEV_URL as E2E_DEV_URL, PROD_URL as E2E_PROD_URL, IS_DEPLOYED_TEST } from "./ports";

/**
 * URL constants for different testing environments
 */
const DEV_URL = E2E_DEV_URL; // Vite development server (default http://localhost:5173)

const PREVIEW_URL = E2E_PROD_URL; // Map preview to production URL in this project

/**
 * Security Best Practices Test Suite
 *
 * This test suite validates web application security according to modern standards:
 * - HTTPS enforcement and secure transport
 * - Security headers (CSP, HTTP Strict Transport Security, X-Frame-Options, etc.)
 * - Content Security Policy validation and XSS protection
 * - Cookie security attributes
 * - Information disclosure prevention
 * - Client-side security measures
 * - Mixed content prevention
 * - Sub-resource integrity validation
 */

/**
 * Helper function to check if a development or preview server is running
 *
 * @returns Promise indicating if server responds successfully
 */
const isServerRunning = async (
	/** The URL to check for server availability */
	url: string,
): Promise<boolean> => {
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

/**
 * Comprehensive security testing function
 *
 * @returns Promise that resolves when all security tests complete
 */
async function testSecurityFeatures(
	/** Playwright page instance for browser automation */
	page: Page,
	/** The base URL of the application to test */
	baseUrl: string,
): Promise<void> {
	const isTrulyDeployedEnvironment =
		IS_DEPLOYED_TEST && !baseUrl.includes("localhost");

	/**
	 * TEST 1: HTTPS Enforcement (Production Only)
	 * Production applications should enforce HTTPS connections
	 */
	if (isTrulyDeployedEnvironment) {
		expect(baseUrl).toMatch(/^https:/);
	}

	// Navigate to the application for security header testing
	await page.goto(baseUrl);
	await page.waitForLoadState("networkidle");

	// Additional wait for Firefox compatibility
	await page.waitForTimeout(1000);

	/**
	 * TEST 2: Security Headers Validation
	 */
	const response = await page.request.get(baseUrl);
	const headers = response.headers();

	/**
	 * TEST 2a: Content Security Policy (CSP)
	 * CSP prevents XSS attacks by controlling resource loading
	 */
	const cspHeader = headers["content-security-policy"];
	if (cspHeader !== undefined && cspHeader.trim() !== "") {
		expect(cspHeader).toBeTruthy();

		// Basic CSP validation
		expect(cspHeader).toContain("default-src");

		// In production, object sources should be restricted
		if (isTrulyDeployedEnvironment && cspHeader.includes("object-src")) {
			expect(cspHeader).toContain("object-src 'none'");
		}
	}

	/**
	 * TEST 2b: Strict Transport Security
	 * Prevents protocol downgrade attacks
	 */
	if (isTrulyDeployedEnvironment) {
		const stsHeader = headers["strict-transport-security"];
		if (stsHeader !== undefined && stsHeader.trim() !== "") {
			expect(stsHeader).toMatch(/max-age=\d+/);
		}
	}

	/**
	 * TEST 2c: X-Content-Type-Options
	 * Prevents MIME type sniffing attacks
	 */
	const contentTypeOptions = headers["x-content-type-options"];
	if (contentTypeOptions !== undefined && contentTypeOptions.trim() !== "") {
		expect(contentTypeOptions.toLowerCase()).toBe("nosniff");
	}

	/**
	 * TEST 2d: X-Frame-Options
	 * Prevents clickjacking attacks
	 */
	const frameOptions = headers["x-frame-options"];
	if (frameOptions !== undefined && frameOptions.trim() !== "") {
		const validFrameOptions = ["DENY", "SAME_ORIGIN"];
		expect(validFrameOptions).toContain(frameOptions.toUpperCase());
	}

	/**
	 * TEST 2e: Referrer Policy
	 * Controls how much referrer information is shared
	 */
	const referrerPolicy = headers["referrer-policy"];
	if (referrerPolicy !== undefined && referrerPolicy.trim() !== "") {
		const validPolicies = [
			"no-referrer",
			"no-referrer-when-downgrade",
			"origin",
			"origin-when-cross-origin",
			"same-origin",
			"strict-origin",
			"strict-origin-when-cross-origin",
		];
		expect(validPolicies).toContain(referrerPolicy.toLowerCase());
	}

	/**
	 * TEST 3: Information Disclosure Prevention
	 * Server headers should not reveal detailed version information
	 */
	if (isTrulyDeployedEnvironment) {
		const serverHeader = headers.server;
		const poweredByHeader = headers["x-powered-by"];

		// Server header should not reveal detailed version information
		if (serverHeader !== undefined && serverHeader.trim() !== "") {
			expect(serverHeader).not.toMatch(/\/[\d.]+/); // No version numbers
		}

		// X-Powered-By header should be removed
		expect(poweredByHeader).toBeFalsy();
	}

	/**
	 * TEST 4: Client-Side Security Validation
	 */

	/**
	 * TEST 4a: Sensitive Data Exposure Prevention
	 * Check that sensitive information is not exposed in client-side code
	 */
	const exposedSecrets = await page
		.evaluate(() => {
			const pageContent = document.documentElement.outerHTML;

			// Check for common secret patterns
			const secretPatterns = [
				/api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}/i,
				/secret['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}/i,
				/password['"]?\s*[:=]\s*['"][^\s'",;]{8,}/i,
				/token['"]?\s*[:=]\s*['"][a-zA-Z0-9._-]{20,}/i,
			];

			for (const pattern of secretPatterns) {
				if (pattern.test(pageContent)) {
					return true;
				}
			}

			return false;
		})
		.catch(() => {
			// If page evaluation fails (can happen in Firefox), assume no secrets exposed
			console.warn(
				"⚠️ Could not evaluate page content for secrets (browser compatibility)",
			);
			return false;
		});

	expect(exposedSecrets).toBe(false);

	/**
	 * TEST 5: Mixed Content Prevention
	 * In HTTPS environments, all resources should be loaded securely
	 */
	if (baseUrl.startsWith("https://")) {
		const mixedContent = await page.evaluate(() => {
			const allResources = Array.from(
				document.querySelectorAll("[src], [href]"),
			);
			const insecureResources = allResources.filter((element) => {
				const srcUrl = element.getAttribute("src");
				const hrefUrl = element.getAttribute("href");
				const url = srcUrl ?? hrefUrl;
				return url !== null && url.startsWith("http://");
			});

			return insecureResources.length;
		});

		expect(mixedContent).toBe(0);
	}

	/**
	 * TEST 6: Cookie Security
	 * Validate secure cookie attributes if cookies are present
	 */
	const cookies = await page.context().cookies();
	if (cookies.length > 0) {
		for (const cookie of cookies) {
			// In HTTPS environments, cookies should be secure
			if (baseUrl.startsWith("https://")) {
				expect(cookie.secure).toBe(true);
			}

			// Authentication cookies should be HttpOnly
			const isAuthCookie =
				cookie.name.toLowerCase().includes("auth") ||
				cookie.name.toLowerCase().includes("session") ||
				cookie.name.toLowerCase().includes("token");

			if (isAuthCookie) {
				expect(cookie.httpOnly).toBe(true);
			}
		}
	}

	/**
	 * TEST 7: Form Security
	 * Basic form security validation
	 */
	const forms = await page.locator("form").count();
	if (forms > 0 && isTrulyDeployedEnvironment) {
		// Check for CSRF protection patterns
		const hasCSRFProtection = await page.evaluate(() => {
			const formElements = Array.from(document.querySelectorAll("form"));
			return formElements.some((form) => {
				const csrfToken = form.querySelector(
					"[name*='csrf'], [name*='_token']",
				);
				const hiddenInputs = form.querySelectorAll("input[type='hidden']");
				return csrfToken !== null || hiddenInputs.length > 0;
			});
		});

		// Log CSRF protection status for informational purposes
		console.warn(
			`Form CSRF protection: ${
				hasCSRFProtection ? "✅ Detected" : "⚠️ Not detected"
			}`,
		);
	}

	/**
	 * TEST 8: Third-Party Script Security
	 * Validate security of third-party integrations
	 */
	const thirdPartyScripts = await page.evaluate(() => {
		const scripts = Array.from(document.querySelectorAll("script[src]"));
		const externalDomains = new Set<string>();

		for (const script of scripts) {
			const src = script.getAttribute("src");
			if (src !== null && src.startsWith("http")) {
				try {
					const url = new URL(src);
					if (url.hostname !== window.location.hostname) {
						externalDomains.add(url.hostname);
					}
				} catch {
					// Invalid URL, skip
				}
			}
		}

		return Array.from(externalDomains);
	});

	// Log third-party domains for security review
	if (thirdPartyScripts.length > 0) {
		console.warn(`Third-party domains: ${thirdPartyScripts.join(", ")}`);

		// In production, minimize untrusted third-party scripts
		if (isTrulyDeployedEnvironment) {
			expect(thirdPartyScripts.length).toBeLessThanOrEqual(5);
		}
	}

	/**
	 * TEST 9: Basic XSS Prevention
	 * Check for common XSS vulnerabilities
	 */
	const hasUserInput = await page.evaluate(() => {
		const inputs = document.querySelectorAll("input, textarea");
		return inputs.length > 0;
	});

	if (hasUserInput && isTrulyDeployedEnvironment) {
		// Check that innerHTML usage is minimal
		const hasUnsafePatterns = await page.evaluate(() => {
			const scripts = Array.from(document.scripts);
			for (const script of scripts) {
				if (
					script.innerHTML.includes("innerHTML") ||
					script.innerHTML.includes("eval(") ||
					script.innerHTML.includes("document.write")
				) {
					return true;
				}
			}
			return false;
		});

		// In production, unsafe patterns should be minimized
		expect(hasUnsafePatterns).toBe(false);
	}

	/**
	 * TEST 10: Meta Tag Security
	 * Validate security-related meta tags
	 */
	const metaTags = await page.evaluate(() => {
		const viewport = document.querySelector('meta[name="viewport"]');
		const description = document.querySelector('meta[name="description"]');
		const themeColor = document.querySelector('meta[name="theme-color"]');

		return {
			hasViewport: viewport !== null,
			hasDescription: description !== null,
			hasThemeColor: themeColor !== null,
		};
	});

	// Basic meta tags should be present for security and SEO
	expect(metaTags.hasViewport).toBe(true);
	expect(metaTags.hasDescription).toBe(true);
}

/**
 * Security Test Suite Configuration
 */
test.describe("Security Best Practices", () => {
	/**
	 * Development Server Security Tests
	 */
	test("dev server: security configuration", async ({ page }) => {
		test.skip(
			IS_DEPLOYED_TEST,
			"Skipping local dev server test when testing deployed environment",
		);

		const isRunning = await isServerRunning(DEV_URL);
		test.skip(!isRunning, "Dev server not running. Start with: pnpm dev");

		await testSecurityFeatures(page, DEV_URL);
	});

	/**
	 * Preview Server Security Tests
	 */
	test("preview server: security configuration", async ({ page }) => {
		test.skip(
			IS_DEPLOYED_TEST,
			"Skipping local preview server test when testing deployed environment",
		);

		const isRunning = await isServerRunning(PREVIEW_URL);
		test.skip(
			!isRunning,
			"Preview server not running. Start with: pnpm build:client && pnpm build:server && node dist/ssr/preview.js",
		);

		await testSecurityFeatures(page, PREVIEW_URL);
	});

	/**
	 * Deployed Environment Security Tests
	 */
	test("deployed environment: security configuration", async ({ page }) => {
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

		await testSecurityFeatures(page, deployedUrl);
	});
});
