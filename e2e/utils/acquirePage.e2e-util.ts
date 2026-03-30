import type { BrowserContext, Page } from "@playwright/test";
import { Effect, type Scope } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

/**
 * Acquire a Playwright page and guarantee it closes with the Effect scope.
 *
 * @param ctx - Browser context used to create the page.
 * @returns A scoped Effect that yields a new page and closes it on release.
 */
export default function acquirePage(
	ctx: BrowserContext,
): Effect.Effect<Page, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(() => ctx.newPage()),
		(page) => Effect.ignore(fromPromiseVoid(() => page.close())),
	);
}
