import type { Effect } from "effect";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

export default function expectEffect(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return fromPromiseVoid(thunk);
}
