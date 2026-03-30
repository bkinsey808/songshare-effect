import { Effect } from "effect";

/**
 * Normalize an unknown thrown value into an `Error` instance.
 *
 * @param error - Raw thrown value from a promise rejection handler.
 * @returns An `Error` instance suitable for `Effect.tryPromise`.
 */
function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

/**
 * Lift a promise-producing thunk into an Effect that maps failures to `Error`.
 *
 * @param thunk - Promise-producing function to execute lazily.
 * @returns An Effect that resolves with the promise value or fails with an `Error`.
 */
export default function fromPromise<TValue>(
	thunk: () => Promise<TValue>,
): Effect.Effect<TValue, Error> {
	return Effect.tryPromise({
		try: thunk,
		catch: toError,
	});
}
