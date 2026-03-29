import { Effect } from "effect";

export default function runEffect<TValue>(effect: Effect.Effect<TValue, Error>): Promise<TValue> {
	return Effect.runPromise(effect);
}
