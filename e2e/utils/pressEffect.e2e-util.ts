import type { Locator } from "@playwright/test";
import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Wrap `locator.press` in an Effect.
 *
 * @param locator - Playwright locator that receives the key press.
 * @param key - Keyboard key or shortcut string.
 * @returns An Effect that resolves when the key press completes.
 */
export default function pressEffect(locator: Locator, key: string): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.press(key));
}
