import { Effect } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";

export default function fromPromiseVoid(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return Effect.asVoid(fromPromise(thunk));
}
