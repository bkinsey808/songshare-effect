import type { BrowserContext } from "@playwright/test";
import { Effect, type Scope } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

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
