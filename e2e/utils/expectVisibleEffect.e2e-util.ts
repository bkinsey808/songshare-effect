import { expect, type Locator } from "@playwright/test";
import type { Effect } from "effect";
import expectEffect from "@/e2e/utils/expectEffect.e2e-util.ts";

export type LocatorExpectOptions = { timeout?: number };

export default function expectVisibleEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).toBeVisible(options));
}
