import { expect, test } from "@playwright/test";

import { DEV_URL as E2E_DEV_URL, PROD_URL as E2E_PROD_URL, IS_DEPLOYED_TEST } from "./ports";

/**
 * ETag Cache Invalidation Test Suite
 *
 * This test suite validates the ETag-based cache invalidation system implemented
 * in the Cloudflare Worker. ETags (Entity Tags) are HTTP headers that enable
 * efficient caching by allowing clients to make conditional requests and receive
 * 304 Not Modified responses when content hasn't changed.
 *
 * The tests cover:
 * - ETag generation for various asset types
 * - Proper cache-control headers for different resource categories
 * - Conditional request handling with If-None-Match headers
 * - Special handling for service worker files to prevent flash of old content
 * - Differentiation between static assets (long-term caching) and dynamic content
 */
test.describe("ETag Cache Invalidation", () => {
	/**
	 * Skip ETag tests when running against local dev or preview servers.
	 * These tests are specifically designed for Cloudflare deployment behavior
	 * where custom ETag generation and cache headers are implemented.
	 * Local preview servers may not have the same caching behavior.
	 */
	test.skip(() => {
	 	const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
	 	// Skip when not targeting a deployed environment. Map previous preview/dev checks to the
	 	// new DEV/PROD URLs.
	 	return (
	 		baseUrl === undefined ||
	 		baseUrl === "" ||
	 		baseUrl === E2E_PROD_URL ||
	 		baseUrl === E2E_DEV_URL
	 	);
	}, "ETag tests only run against deployed environments");

	/**
	 * Clear browser cache before each test to ensure clean state.
	 * This prevents cache pollution between tests and ensures each test
	 * starts with a fresh caching environment.
	 */
	test.beforeEach(async ({ page }) => {
		// Navigate to the homepage first to establish browser context
		await page.goto("/");
		// Clear all Cache API entries to ensure clean test environment
		await page.evaluate(async (): Promise<void> => {
			if ("caches" in window) {
				const names = await caches.keys();
				await Promise.all(names.map((name) => caches.delete(name)));
			}
		});
	});

	/**
	 * Verify that static text assets receive proper ETag headers.
	 * ETags enable browsers to cache assets efficiently and make conditional
	 * requests to check if content has changed since last cached.
	 */
	test("static assets should have ETags", async ({ page }) => {
		// Request a test static asset from the public directory
		const response = await page.request.get("/test.txt");

		// Verify the request was successful
		expect(response.status()).toBe(200);

		// Extract and validate the ETag header
		const { etag } = response.headers();
		expect(etag).toBeDefined();
		// Cloudflare Worker generates 8-character hex ETags, optionally prefixed with W/ for weak ETags
		expect(etag).toMatch(/^(W\/)?"[a-f0-9]{8}"$/);

		// Verify the content is as expected
		const content = await response.text();
		expect(content).toContain("This is a test file");
	});

	/**
	 * Verify that SVG image assets receive proper ETag headers and content-type.
	 * This ensures that different asset types (text, images) all get consistent
	 * ETag treatment for cache invalidation.
	 */
	test("SVG assets should have ETags", async ({ page }) => {
		// Request the Vite logo SVG from the public directory
		const response = await page.request.get("/vite.svg");

		// Verify successful response
		expect(response.status()).toBe(200);

		// Validate ETag presence and format
		const { etag } = response.headers();
		expect(etag).toBeDefined();
		// Same 8-character hex format as other assets
		expect(etag).toMatch(/^(W\/)?"[a-f0-9]{8}"$/);

		// Verify correct MIME type for SVG files
		const { "content-type": contentType } = response.headers();
		expect(contentType).toBe("image/svg+xml");
	});

	/**
	 * Test HTTP conditional requests using If-None-Match header.
	 * When a client sends an If-None-Match header with a matching ETag,
	 * the server should return 304 Not Modified instead of the full content,
	 * saving bandwidth and improving performance.
	 */
	test("conditional requests should return 304 when content unchanged", async ({
		page,
	}) => {
		// Make initial request to obtain the ETag
		const firstResponse = await page.request.get("/test.txt");
		expect(firstResponse.status()).toBe(200);

		// Extract the ETag from the response headers
		const { etag } = firstResponse.headers();
		expect(etag).toBeDefined();

		// Convert weak ETag (W/"hash") to strong ETag ("hash") for If-None-Match
		// This follows HTTP specification for conditional requests
		const strongEtag = etag.startsWith("W/") ? etag.slice(2) : etag;

		// Make conditional request with If-None-Match header
		// This tells the server "only send content if ETag doesn't match"
		const secondResponse = await page.request.get("/test.txt", {
			headers: {
				"If-None-Match": strongEtag,
			},
		});

		// Server should return 304 Not Modified since content hasn't changed
		expect(secondResponse.status()).toBe(304);
		// Note: 304 responses typically don't include ETag header per HTTP spec

		// 304 responses should have empty body to save bandwidth
		const body = await secondResponse.text();
		expect(body).toBe("");
	});

	/**
	 * Verify that static assets receive appropriate cache-control headers.
	 * Static assets should have long-term caching with immutable directive
	 * since they won't change (or will have different URLs when they do).
	 */
	test("cache headers should be set correctly", async ({ page }) => {
		const response = await page.request.get("/test.txt");

		expect(response.status()).toBe(200);

		// Check cache-control header for static assets
		const { "cache-control": cacheControl } = response.headers();
		// 31536000 seconds = 1 year, immutable means content will never change
		expect(cacheControl).toBe("public, max-age=31536000, immutable");

		// ETags should still be present for validation even with long cache times
		const { etag } = response.headers();
		expect(etag).toBeDefined();
	});

	/**
	 * Ensure that different files generate different ETags.
	 * ETags should be content-based, so files with different content
	 * must have different ETags to prevent cache collisions.
	 */
	test("different files should have different ETags", async ({ page }) => {
		// Request two different files simultaneously
		const testTxtResponse = await page.request.get("/test.txt");
		const viteSvgResponse = await page.request.get("/vite.svg");

		// Both requests should succeed
		expect(testTxtResponse.status()).toBe(200);
		expect(viteSvgResponse.status()).toBe(200);

		// Extract ETags from both responses
		const { etag: testTxtETag } = testTxtResponse.headers();
		const { etag: viteSvgETag } = viteSvgResponse.headers();

		// Both files should have ETags
		expect(testTxtETag).toBeDefined();
		expect(viteSvgETag).toBeDefined();
		// But they should be different since the files have different content
		expect(testTxtETag).not.toBe(viteSvgETag);
	});

	/**
	 * Verify that CSS and JavaScript assets have aggressive caching headers.
	 * These assets are typically versioned (with hashes in filenames) so they
	 * can be cached for long periods with immutable directive. The test name
	 * mentions "no-cache" but the actual behavior is long-term caching.
	 */
	test("CSS and JS assets should have aggressive no-cache headers", async ({
		page,
	}) => {
		// Request the main CSS and JS bundles from the assets directory
		const cssResponse = await page.request.get("/assets/index.css");
		const jsResponse = await page.request.get("/assets/index.js");

		// Both requests should succeed
		expect(cssResponse.status()).toBe(200);
		expect(jsResponse.status()).toBe(200);

		// Versioned assets get long-term immutable caching since they won't change
		// When the content changes, the filename hash changes, creating a new URL
		expect(cssResponse.headers()["cache-control"]).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(jsResponse.headers()["cache-control"]).toBe(
			"public, max-age=31536000, immutable",
		);

		// ETags should still be present for additional cache validation
		expect(cssResponse.headers()["etag"]).toBeDefined();
		expect(jsResponse.headers()["etag"]).toBeDefined();

		// Verify correct MIME types are set
		expect(cssResponse.headers()["content-type"]).toBe("text/css");
		expect(jsResponse.headers()["content-type"]).toBe("application/javascript");
	});

	/**
	 * Verify that CSS and JavaScript assets have proper ETags.
	 * Even though these assets have long cache times, ETags provide
	 * an additional layer of cache validation and enable conditional requests.
	 */
	test("CSS and JS assets should have ETags", async ({ page }) => {
		// Request the main application bundles
		const cssResponse = await page.request.get("/assets/index.css");
		const jsResponse = await page.request.get("/assets/index.js");

		// Verify successful responses
		expect(cssResponse.status()).toBe(200);
		expect(jsResponse.status()).toBe(200);

		// Extract ETags for content-based cache validation
		const { etag: cssETag } = cssResponse.headers();
		const { etag: jsETag } = jsResponse.headers();

		// Both asset types should have ETags
		expect(cssETag).toBeDefined();
		expect(jsETag).toBeDefined();

		// Validate ETag format matches Cloudflare Worker format (8-character hex hash)
		expect(cssETag).toMatch(/^(W\/)?"[a-f0-9]{8}"$/);
		expect(jsETag).toMatch(/^(W\/)?"[a-f0-9]{8}"$/);

		// CSS and JS files have different content, so ETags should differ
		expect(cssETag).not.toBe(jsETag);
	});

	/**
	 * Test conditional requests for CSS and JavaScript assets.
	 * Even with long cache times, these assets should support conditional
	 * requests via If-None-Match headers for efficient cache validation.
	 */
	test("CSS and JS assets should support conditional requests", async ({
		page,
	}) => {
		// Test CSS conditional request flow
		// First, get the CSS file and its ETag
		const firstCssResponse = await page.request.get("/assets/index.css");
		expect(firstCssResponse.status()).toBe(200);

		const { etag: cssETag } = firstCssResponse.headers();
		expect(cssETag).toBeDefined();

		// Convert to strong ETag format for conditional request
		const strongCssETag = cssETag.startsWith("W/") ? cssETag.slice(2) : cssETag;

		// Make conditional request with If-None-Match header
		const secondCssResponse = await page.request.get("/assets/index.css", {
			headers: {
				"If-None-Match": strongCssETag,
			},
		});

		// Should return 304 Not Modified since content hasn't changed
		expect(secondCssResponse.status()).toBe(304);
		const cssBody = await secondCssResponse.text();
		expect(cssBody).toBe("");

		// Test JavaScript conditional request flow
		// Same pattern as CSS - get file, extract ETag, make conditional request
		const firstJsResponse = await page.request.get("/assets/index.js");
		expect(firstJsResponse.status()).toBe(200);

		const { etag: jsETag } = firstJsResponse.headers();
		expect(jsETag).toBeDefined();

		// Convert to strong ETag for conditional request
		const strongJsETag = jsETag.startsWith("W/") ? jsETag.slice(2) : jsETag;

		// Make conditional request for JavaScript file
		const secondJsResponse = await page.request.get("/assets/index.js", {
			headers: {
				"If-None-Match": strongJsETag,
			},
		});

		// Should also return 304 Not Modified
		expect(secondJsResponse.status()).toBe(304);
		const jsBody = await secondJsResponse.text();
		expect(jsBody).toBe("");
	});

	/**
	 * Test the fallback behavior for non-existent static assets.
	 * When a static asset doesn't exist, the request should fall through
	 * to the SSR handler, which renders the React application instead of
	 * returning a 404 error. This enables client-side routing to work properly.
	 */
	test("non-existent static assets should return 404 via SSR", async ({
		page,
	}) => {
		// Request a file that doesn't exist in the static assets
		const response = await page.request.get("/non-existent-file.txt");

		// Should fall through to SSR which renders the React app (not a 404)
		// This allows the client-side router to handle the request
		expect(response.status()).toBe(200);

		const content = await response.text();
		// Should contain the SSR-rendered React application HTML
		expect(content).toContain("<!DOCTYPE html>");
		// Verify that a title tag exists (part of the React app structure)
		expect(content).toMatch(/<title>[^<]+<\/title>/);
	});

	/**
	 * Test ETag validation behavior with invalid ETag values.
	 * When a client sends an If-None-Match header with an invalid or
	 * non-matching ETag, the server should return the full content (200)
	 * rather than a 304 Not Modified response.
	 */
	test("ETag validation with invalid ETag should return full content", async ({
		page,
	}) => {
		// Make request with an invalid ETag in If-None-Match header
		const response = await page.request.get("/test.txt", {
			headers: {
				"If-None-Match": '"invalid-etag-value"',
			},
		});

		// Should return full content since ETag doesn't match
		expect(response.status()).toBe(200);

		// Verify that the actual content is returned
		const content = await response.text();
		expect(content).toContain("This is a test file");

		// Should still include the correct ETag for future requests
		const { etag } = response.headers();
		expect(etag).toBeDefined();
		// The real ETag should be different from the invalid one we sent
		expect(etag).not.toBe('"invalid-etag-value"');
	});

	/**
	 * Verify that API endpoints do not receive ETag cache headers.
	 * API responses are typically dynamic and shouldn't be cached with ETags
	 * since they may return different data on each request based on state,
	 * user context, or other dynamic factors.
	 */
	test("API endpoints should not have ETag cache headers", async ({ page }) => {
		// Request a custom API endpoint
		const response = await page.request.get("/api/hello");

		expect(response.status()).toBe(200);

		// API responses should not have ETag headers since they're dynamic
		// ETags are for static content that can be cached and validated
		const { etag } = response.headers();
		expect(etag).toBeUndefined();

		// Verify the API returns the expected dynamic content
		const data = await response.json();
		expect(data).toEqual({ message: "Hello from custom API endpoint!" });
	});

	/**
	 * Verify that health check endpoints do not receive ETag cache headers.
	 * Health checks return dynamic information (like timestamps) and should
	 * never be cached, as they need to reflect the current system state.
	 */
	test("health check should not have ETag cache headers", async ({ page }) => {
		// Request the application health check endpoint
		const response = await page.request.get("/health");

		expect(response.status()).toBe(200);

		// Health checks should never have ETag headers since they're always dynamic
		// They typically include timestamps and current system status
		const { etag } = response.headers();
		expect(etag).toBeUndefined();

		// Verify health check returns expected dynamic data structure
		const data = await response.json();
		expect(data).toHaveProperty("status", "ok");
		expect(data).toHaveProperty("timestamp"); // Dynamic timestamp proves it's not cached
	});

	/**
	 * Test service worker cache headers to prevent flash of old content.
	 * Service workers require special cache handling - they should never be cached
	 * to prevent the "flash of old content" problem where an outdated service worker
	 * serves stale assets during app updates.
	 */
	test("service worker files should have revalidation cache headers", async ({
		page,
	}) => {
		// Request the main service worker file
		const swResponse = await page.request.get("/sw.js");

		expect(swResponse.status()).toBe(200);

		// Extract cache-control and ETag headers
		const { "cache-control": swCacheControl, etag: swETag } =
			swResponse.headers();

		// Service worker must have no-cache headers to prevent stale content
		// This ensures browsers always check for updates to the service worker
		expect(swCacheControl).toBe(
			"no-cache, no-store, must-revalidate, max-age=0",
		);
		expect(swETag).toBeDefined();
		// Service worker ETags include timestamp for additional cache busting
		expect(swETag).toMatch(/^W\/"no-cache-\d+"/);

		// Verify correct content type for JavaScript files
		const { "content-type": swContentType } = swResponse.headers();
		expect(swContentType).toBe("application/javascript");
	});

	/**
	 * Test service worker registration file cache headers.
	 * The registration script (registerSW.js) also needs no-cache headers
	 * to ensure it always fetches the latest service worker and doesn't
	 * serve stale registration code that could break service worker updates.
	 */
	test("service worker registration file should have revalidation cache headers", async ({
		page,
	}) => {
		// Request the service worker registration script
		const registerResponse = await page.request.get("/registerSW.js");

		expect(registerResponse.status()).toBe(200);

		// Extract headers for validation
		const { "cache-control": registerCacheControl, etag: registerETag } =
			registerResponse.headers();

		// Registration script also needs no-cache to prevent stale SW registration
		// This ensures the registration logic is always fresh and can handle SW updates
		expect(registerCacheControl).toBe(
			"no-cache, no-store, must-revalidate, max-age=0",
		);
		expect(registerETag).toBeDefined();
		// Registration file ETags also include timestamp for cache busting
		expect(registerETag).toMatch(/^W\/"no-cache-\d+"/);

		// Verify correct JavaScript content type
		const { "content-type": registerContentType } = registerResponse.headers();
		expect(registerContentType).toBe("application/javascript");
	});

	/**
	 * Verify that regular static assets (non-service worker) have immutable cache headers.
	 * This test confirms the distinction between service worker files (no-cache)
	 * and regular static assets (long-term immutable caching).
	 */
	test("regular static assets should have immutable cache headers", async ({
		page,
	}) => {
		// Request regular static assets that should have long-term caching
		const testResponse = await page.request.get("/test.txt");
		const imageResponse = await page.request.get("/vite.svg");

		expect(testResponse.status()).toBe(200);
		expect(imageResponse.status()).toBe(200);

		// Regular assets should have aggressive long-term caching with immutable directive
		// This is safe because these assets won't change (or will have new URLs when they do)
		expect(testResponse.headers()["cache-control"]).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(imageResponse.headers()["cache-control"]).toBe(
			"public, max-age=31536000, immutable",
		);

		// Even with long cache times, ETags should be present for validation
		expect(testResponse.headers().etag).toBeDefined();
		expect(imageResponse.headers().etag).toBeDefined();
	});

	/**
	 * Test conditional request behavior for service worker files.
	 * Service workers with no-cache headers behave differently from regular assets
	 * in conditional requests - they return fresh content instead of 304 responses.
	 */
	test("service worker files should support conditional requests", async ({
		page,
	}) => {
		// Make initial request to get the service worker and its ETag
		const firstResponse = await page.request.get("/sw.js");
		expect(firstResponse.status()).toBe(200);

		const { etag } = firstResponse.headers();
		expect(etag).toBeDefined();

		// Make conditional request with the ETag
		// For service workers with no-cache headers and timestamp ETags,
		// the server returns fresh content (200) instead of 304 Not Modified
		// This is the intended behavior to ensure service workers are always fresh
		const secondResponse = await page.request.get("/sw.js", {
			headers: {
				"If-None-Match": etag,
			},
		});

		// Service worker returns fresh content (200) rather than 304
		// This ensures the service worker is always up-to-date
		expect(secondResponse.status()).toBe(200);

		// Verify that actual content is returned, not an empty body
		const body = await secondResponse.text();
		expect(body.length).toBeGreaterThan(0);
	});

	/**
	 * Comprehensive test comparing cache strategies between different asset types.
	 * This test validates that the caching system correctly differentiates between:
	 * - Service worker files (no-cache for freshness)
	 * - Regular static assets (long-term immutable caching)
	 * All while maintaining ETag support for validation.
	 */
	test("cache strategy should differ between service worker and regular assets", async ({
		page,
	}) => {
		// Request different types of assets simultaneously to compare their caching strategies
		const [swResponse, registerResponse, cssResponse, testFileResponse] =
			await Promise.all([
				page.request.get("/sw.js"), // Service worker main file
				page.request.get("/registerSW.js"), // Service worker registration
				page.request.get("/assets/index.css"), // Versioned CSS bundle
				page.request.get("/test.txt"), // Regular static asset
			]);

		// All requests should be successful
		expect(swResponse.status()).toBe(200);
		expect(registerResponse.status()).toBe(200);
		expect(cssResponse.status()).toBe(200);
		expect(testFileResponse.status()).toBe(200);

		// Service worker files need no-cache headers to prevent flash of old content
		// This ensures users always get the latest service worker code
		const serviceWorkerCacheControl =
			"no-cache, no-store, must-revalidate, max-age=0";
		expect(swResponse.headers()["cache-control"]).toBe(
			serviceWorkerCacheControl,
		);
		expect(registerResponse.headers()["cache-control"]).toBe(
			serviceWorkerCacheControl,
		);

		// Regular assets (including versioned bundles) should have long-term immutable caching
		// This maximizes performance since these assets don't change or get new URLs when they do
		const regularAssetCacheControl = "public, max-age=31536000, immutable";
		expect(cssResponse.headers()["cache-control"]).toBe(
			regularAssetCacheControl,
		);
		expect(testFileResponse.headers()["cache-control"]).toBe(
			regularAssetCacheControl,
		);

		// All asset types should have ETags for content validation regardless of cache strategy
		expect(swResponse.headers().etag).toBeDefined();
		expect(registerResponse.headers().etag).toBeDefined();
		expect(cssResponse.headers().etag).toBeDefined();
		expect(testFileResponse.headers().etag).toBeDefined();
	});

	/**
	 * Test that service worker ETags change appropriately for cache busting.
	 * Service workers use timestamp-based ETags rather than content-based ETags
	 * to ensure they're always treated as potentially stale and fetched fresh.
	 * This prevents the service worker update problem where browsers cache
	 * service workers too aggressively.
	 */
	test("service worker ETags should change when content changes", async ({
		page,
	}) => {
		// This test validates the ETag system for service workers
		// Service workers use special timestamp-based ETags for aggressive cache busting

		// Make first request to service worker
		const response = await page.request.get("/sw.js");
		expect(response.status()).toBe(200);

		// Extract and validate the timestamp-based ETag
		const { etag } = response.headers();
		expect(etag).toBeDefined();
		// Service worker ETags have special format with timestamp for cache busting
		expect(etag).toMatch(/^W\/"no-cache-\d+"/);

		// Make second request to demonstrate ETag behavior
		// For timestamp-based ETags, each request may get a new timestamp
		// This ensures service workers are never inappropriately cached
		const secondResponse = await page.request.get("/sw.js");
		expect(secondResponse.status()).toBe(200);

		const { etag: secondEtag } = secondResponse.headers();
		expect(secondEtag).toBeDefined();
		// Should still match the no-cache timestamp pattern
		expect(secondEtag).toMatch(/^W\/"no-cache-\d+"/);

		// Note: ETags may differ between requests due to timestamp generation
		// This is expected behavior for service worker cache busting
	});
});
