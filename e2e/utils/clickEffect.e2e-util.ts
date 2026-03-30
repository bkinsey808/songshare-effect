import type { Locator } from "@playwright/test";
import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Wrap `locator.click` in an Effect.
 *
 * @param locator - Playwright locator to click.
 * @returns An Effect that resolves when the click completes.
 */
export default function clickEffect(locator: Locator): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.click());
}
