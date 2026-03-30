import type { BrowserContext } from "@playwright/test";
import { Effect, type Scope } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Acquire a browser context and guarantee it closes with the Effect scope.
 *
 * @param acquire - Promise-returning factory that creates the browser context.
 * @returns A scoped Effect that yields the context and closes it on release.
 */
export default function acquireBrowserContext(
	acquire: () => Promise<BrowserContext>,
): Effect.Effect<BrowserContext, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(acquire),
		(ctx) => Effect.ignore(fromPromiseVoid(() => ctx.close())),
	);
}
