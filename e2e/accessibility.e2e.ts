/**
 * Accessibility Spec
 *
 * This test suite validates accessibility best practices for the web application, including:
 * - Sufficient color contrast (WCAG 2.0/2.1 A/AA)
 * - Presence of ARIA attributes and semantic HTML
 * - Keyboard navigation and visible focus
 * - Main landmark and skip link
 * - Accessible form elements, images, and page structure
 *
 * Uses Playwright and axe-core for automated accessibility testing.
 */
import * as axe from "@axe-core/playwright";
import { Page, expect, test } from "@playwright/test";
import type { AxeResults } from "axe-core";

/**
 * Runs axe accessibility checks on a page
 *
 * @returns Promise<AxeResult[]> Array of axe accessibility violations
 */
const getAxeViolations = async (
	/** Playwright page instance */
	page: Page,
): Promise<AxeResults["violations"]> => {
	const results = await new axe.AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa"])
		.analyze();
	return results.violations;
};

test.describe("Accessibility", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	/**
	 * Checks for any critical accessibility violations on the page using axe-core.
	 * Ensures there are no issues violating WCAG 2.0/2.1 A/AA standards.
	 */
	test("no critical accessibility violations (axe)", async ({ page }) => {
		const violations = await getAxeViolations(page);
		if (violations.length > 0) {
			console.warn("Accessibility violations:", violations);
		}
		expect(violations.length).toBe(0);
	});

	/**
	 * Verifies that all text elements have sufficient color contrast
	 * against their backgrounds, conforming to WCAG 2 AA standards.
	 */
	test("sufficient color contrast for text and backgrounds", async ({
		page,
	}) => {
		const violations = await getAxeViolations(page);
		const contrastViolations = violations.filter(
			(v) => v.id === "color-contrast",
		);
		if (contrastViolations.length > 0) {
			console.warn("Color contrast violations:", contrastViolations);
		}
		expect(contrastViolations.length).toBe(0);
	});

	/**
	 * Verifies the presence of a <main> landmark or role="main" region and
	 * a skip link for keyboard users to bypass navigation.
	 * This supports better screen reader and keyboard accessibility.
	 */
	test("main landmark and skip link present", async ({ page }) => {
		const hasMain: number = await page.locator("main, [role='main']").count();
		expect(hasMain).toBeGreaterThanOrEqual(1);

		const hasSkipLink: number = await page
			.locator('a[href^="#"], a[href^="/#"]')
			.filter({ hasText: /skip/i })
			.count();
		expect(hasSkipLink).toBeGreaterThanOrEqual(1);
	});

	/**
	 * Ensures the first tabbable element receives keyboard focus and has a visible outline.
	 * Skips WebKit due to known focus outline quirks.
	 */
	test("keyboard navigation and visible focus", async ({
		page,
		browserName,
	}) => {
		test.skip(browserName === "webkit", "WebKit focus quirk: skip test");
		await page.keyboard.press("Tab");
		const active: string | undefined = await page.evaluate(() => {
			return document.activeElement?.tagName;
		});
		expect(active).not.toBe("BODY");

		const outline: string | undefined = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement | null;
			return el ? getComputedStyle(el).outlineStyle : undefined;
		});
		expect(outline === "solid" || outline === "auto").toBe(true);
	});

	/**
	 * Verifies the presence of a descriptive <title> element on the page.
	 * This helps screen reader users understand the purpose of the page.
	 */
	test("page has a descriptive <title>", async ({ page }) => {
		const title = await page.title();
		expect(title.trim().length).toBeGreaterThan(5);
	});

	/**
	 * Ensures all <img> elements include an alt attribute for screen readers.
	 */
	test("all images have alt text", async ({ page }) => {
		const imagesWithoutAlt = await page.$$eval(
			"img:not([alt])",
			(imgs) => imgs.length,
		);
		expect(imagesWithoutAlt).toBe(0);
	});

	/**
	 * Ensures all form inputs have associated labels for screen reader accessibility.
	 */
	test("form inputs have accessible labels", async ({ page }) => {
		const violations = await getAxeViolations(page);
		const labelViolations = violations.filter((v) => v.id === "label");
		expect(labelViolations.length).toBe(0);
	});

	/**
	 * Checks that all interactive elements like buttons and links are keyboard focusable.
	 */
	test("all buttons and links are focusable", async ({ page }) => {
		const unfocusables = await page.$$eval(
			'a, button, [role="button"]',
			(elements) =>
				elements
					.filter(
						(el) =>
							el.getAttribute("tabindex") === "-1" ||
							el.hasAttribute("disabled"),
					)
					.map((el) => ({
						tag: el.tagName,
						outerHTML: el.outerHTML,
						tabindex: el.getAttribute("tabindex"),
						disabled: el.hasAttribute("disabled"),
					})),
		);
		if (unfocusables.length > 0) {
			console.warn("Unfocusable elements:", unfocusables);
		}
		expect(unfocusables.length).toBe(0);
	});

	/**
	 * Ensures that elements are not using tabindex="0" unnecessarily,
	 * which could lead to inconsistent tab ordering.
	 */
	test("no elements use unnecessary tabindex='0'", async ({ page }) => {
		const nonSemanticTabindex = await page.$$eval(
			"[tabindex='0']",
			(els) =>
				els.filter(
					(el) =>
						!["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(
							el.tagName,
						),
				).length,
		);
		expect(nonSemanticTabindex).toBe(0);
	});
});
