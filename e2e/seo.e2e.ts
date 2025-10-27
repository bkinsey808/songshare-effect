import { expect, test } from "@playwright/test";

const SKIP_OG_IMAGE_CHECK = true;

// Individual SEO checks as separate tests
test.describe("SEO checks", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle");
	});

	/**
	 * Checks that the page title matches the PWA_NAME environment variable.
	 */
	test("title matches PWA_NAME", async ({ page }) => {
		const expectedTitle = process.env.PWA_NAME;
		if (expectedTitle === undefined || expectedTitle.trim() === "") {
			throw new Error("PWA_NAME must be set in the environment for this test");
		}
		await expect(page).toHaveTitle(expectedTitle);
	});

	/**
	 * Checks that the page title is not too short or too long.
	 * A good title should be between 10 and 70 characters for SEO purposes.
	 */
	test("title is not too short or too long", async ({ page }) => {
		const title = await page.title();
		expect(title.length).toBeGreaterThanOrEqual(10);
		expect(title.length).toBeLessThanOrEqual(70);
	});

	/**
	 * Checks that a meta description tag exists and is non-empty.
	 */
	test("meta description exists", async ({ page }) => {
		const metaDescription = page.locator('head > meta[name="description"]');
		await expect(metaDescription).toHaveAttribute("content", /.+/);
	});

	/**
	 * Checks that a canonical link tag exists and has a valid URL.
	 *
	 * Canonical URLs help search engines understand the preferred version of a page when multiple URLs have similar
	 * or duplicate content.
	 * The <link rel="canonical"> tag in the <head> tells search engines which URL to treat as the original,
	 * consolidating ranking signals and preventing duplicate content issues.
	 *
	 * @see https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
	 */
	test("canonical link exists and is valid", async ({ page }) => {
		const canonical = page.locator('head > link[rel="canonical"]');
		await expect(canonical).toHaveAttribute("href", /https?:\/\//);
	});

	/**
	 * Checks that Open Graph meta tags exist and have valid content.
	 */
	test("Open Graph tags exist and are valid", async ({ page }) => {
		await expect(
			page.locator('head > meta[property="og:title"]'),
		).toHaveAttribute("content", /.+/);
		await expect(
			page.locator('head > meta[property="og:description"]'),
		).toHaveAttribute("content", /.+/);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!SKIP_OG_IMAGE_CHECK) {
			await expect(
				page.locator('head > meta[property="og:image"]'),
			).toHaveAttribute("content", /https?:\/\//);
		}
	});

	/**
	 * Checks that a Twitter card meta tag exists and is valid.
	 */
	test("Twitter card tag exists and is valid", async ({ page }) => {
		await expect(
			page.locator('head > meta[name="twitter:card"]'),
		).toHaveAttribute("content", /summary|summary_large_image/);
	});

	/**
	 * Checks that a robots meta tag exists and is non-empty, if present.
	 */
	test("robots meta tag exists if present", async ({ page }) => {
		const robots = page.locator('head > meta[name="robots"]');
		if (await robots.count()) {
			await expect(robots).toHaveAttribute("content", /.+/);
		}
	});

	/**
	 * Checks that the <h1> element exists and is visible.
	 * This is important for SEO as it indicates the main topic of the page.
	 */
	test("only one <h1> exists", async ({ page }) => {
		const h1 = page.locator("h1");
		await expect(h1).toHaveCount(1);
		await expect(h1).toBeVisible();
	});

	/**
	 * Checks that the <html> element has a valid lang attribute.
	 */
	test("<html> has valid lang attribute", async ({ page }) => {
		const htmlLang = page.locator("html");
		// eslint-disable-next-line security/detect-unsafe-regex
		await expect(htmlLang).toHaveAttribute("lang", /[a-z]{2}(-[A-Z]{2})?/);
	});

	/**
	 * Checks that all JSON-LD scripts contain valid JSON.
	 */
	test("all JSON-LD scripts are valid JSON", async ({ page }) => {
		const jsonLdScripts = page.locator('script[type="application/ld+json"]');
		const jsonLdCount = await jsonLdScripts.count();
		for (let i = 0; i < jsonLdCount; i++) {
			const content = await jsonLdScripts.nth(i).textContent();
			expect(content).toBeTruthy();
			if (content !== null && content !== "") {
				expect(() => JSON.parse(content)).not.toThrow();
			}
		}
	});

	/**
	 * Checks that all images have non-empty alt attributes.
	 */
	test("all images have alt attributes", async ({ page }) => {
		const images = await page.locator("img").elementHandles();
		for (const img of images) {
			const alt = await img.getAttribute("alt");
			expect(alt).toBeTruthy();
		}
	});

	test.describe("Content + SEO Validation", () => {
		/**
		 * Checks that the main content is present and visible.
		 * This ensures that the page has meaningful content for users and search engines.
		 * The test checks for the presence of the main heading, count button, logos, and instructions.
		 */
		test("content and SEO validations pass", async ({ page }) => {
			const heading = page.locator("h1");
			await expect(heading).toBeVisible();
			await expect(heading).toContainText("Vite");
			await expect(heading).toContainText("React");

			const countButton = page.getByRole("button", { name: /count is \d+/ });
			await expect(countButton).toBeVisible();

			const viteLogo = page.getByAltText("Vite logo");
			const reactLogo = page.getByAltText("React logo");
			await expect(viteLogo).toBeVisible();
			await expect(reactLogo).toBeVisible();

			await expect(page.locator("text=Edit")).toBeVisible();
			await expect(page.locator("text=and save to test HMR")).toBeVisible();
			await expect(
				page.locator("text=Click on the Vite and React logos to learn more"),
			).toBeVisible();
		});
	});

	test("viewport meta tag exists", async ({ page }) => {
		const viewport = page.locator('meta[name="viewport"]');
		await expect(viewport).toHaveAttribute("content", /width=device-width/);
	});

	test("charset meta tag exists", async ({ page }) => {
		const charset = page.locator("meta[charset]");
		await expect(charset).toHaveAttribute("charset", /utf-8/i);
	});

	test("all favicon links have valid href", async ({ page }) => {
		await page.waitForLoadState("domcontentloaded");

		const favicons = await page.locator('link[rel~="icon"]').all();
		expect(favicons.length).toBeGreaterThan(0);

		for (const icon of favicons) {
			await expect(icon).toHaveAttribute("href", /.+/);
		}
	});
});
