import { Effect } from "effect";

function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

export default function fromPromise<TValue>(
	thunk: () => Promise<TValue>,
): Effect.Effect<TValue, Error> {
	return Effect.tryPromise({
		try: thunk,
		catch: toError,
	});
}
