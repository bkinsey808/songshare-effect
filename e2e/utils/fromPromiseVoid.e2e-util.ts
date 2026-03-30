import { Effect } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";

/**
 * Lift a promise-producing thunk into a void Effect.
 *
 * @param thunk - Promise-producing function to execute lazily.
 * @returns An Effect that resolves with `void` when the promise succeeds.
 */
export default function fromPromiseVoid(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return Effect.asVoid(fromPromise(thunk));
}
