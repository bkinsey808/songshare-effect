import { expect, type Locator } from "@playwright/test";
import type { Effect } from "effect";
import expectEffect from "@/e2e/utils/expectEffect.e2e-util.ts";
import type { LocatorExpectOptions } from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";

export default function expectHiddenEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).not.toBeVisible(options));
}
