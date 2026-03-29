import type { Locator } from "@playwright/test";
import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

export default function clickEffect(locator: Locator): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.click());
}
