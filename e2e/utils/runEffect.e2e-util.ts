import { Effect } from "effect";

/**
 * Run an Effect as a promise in E2E helpers.
 *
 * @param effect - Effect to execute.
 * @returns A promise that resolves with the Effect result.
 */
export default function runEffect<TValue>(effect: Effect.Effect<TValue, Error>): Promise<TValue> {
	return Effect.runPromise(effect);
}
