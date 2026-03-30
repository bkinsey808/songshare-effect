import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Wrap an async Playwright expectation in an Effect.
 *
 * @param thunk - Promise-returning expectation callback.
 * @returns An Effect that resolves when the expectation passes.
 */
export default function expectEffect(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return fromPromiseVoid(thunk);
}
