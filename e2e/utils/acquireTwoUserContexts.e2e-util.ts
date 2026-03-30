import type { BrowserContext } from "@playwright/test";
import { Effect, type Scope } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Acquire sender and recipient contexts and close both with the Effect scope.
 *
 * @param acquire - Promise-returning factory that creates both browser contexts.
 * @returns A scoped Effect that yields both contexts and closes them on release.
 */
export default function acquireTwoUserContexts<
	TContexts extends { senderCtx: BrowserContext; recipientCtx: BrowserContext },
>(acquire: () => Promise<TContexts>): Effect.Effect<TContexts, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(acquire),
		({ senderCtx, recipientCtx }) =>
			Effect.ignore(
				fromPromiseVoid(async () => {
					await senderCtx.close();
					await recipientCtx.close();
				}),
			),
	);
}
