import type { Locator } from "@playwright/test";
import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

export default function pressEffect(locator: Locator, key: string): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.press(key));
}
