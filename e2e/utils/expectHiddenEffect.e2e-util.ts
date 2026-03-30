import { expect, type Locator } from "@playwright/test";
import type { Effect } from "effect";
import expectEffect from "@/e2e/utils/expectEffect.e2e-util.ts";
import type { LocatorExpectOptions } from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";

/**
 * Assert that a locator is not visible via Effect.
 *
 * @param locator - Playwright locator expected to remain hidden.
 * @param options - Optional timeout configuration forwarded to Playwright.
 * @returns An Effect that resolves when the hidden assertion passes.
 */
export default function expectHiddenEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).not.toBeVisible(options));
}
