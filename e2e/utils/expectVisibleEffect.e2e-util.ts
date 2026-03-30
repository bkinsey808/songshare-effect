import { expect, type Locator } from "@playwright/test";
import type { Effect } from "effect";
import expectEffect from "@/e2e/utils/expectEffect.e2e-util.ts";

export type LocatorExpectOptions = { timeout?: number };

/**
 * Assert visibility on a locator via Effect.
 *
 * @param locator - Playwright locator expected to become visible.
 * @param options - Optional timeout configuration forwarded to Playwright.
 * @returns An Effect that resolves when the visibility assertion passes.
 */
export default function expectVisibleEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).toBeVisible(options));
}
