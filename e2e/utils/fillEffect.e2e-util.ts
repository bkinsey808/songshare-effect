import type { Locator } from "@playwright/test";
import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Wrap `locator.fill` in an Effect.
 *
 * @param locator - Playwright locator to fill.
 * @param value - Text value to write into the field.
 * @returns An Effect that resolves when the fill action completes.
 */
export default function fillEffect(locator: Locator, value: string): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.fill(value));
}
