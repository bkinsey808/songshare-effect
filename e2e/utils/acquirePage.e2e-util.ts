import type { BrowserContext, Page } from "@playwright/test";
import { Effect, type Scope } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";

export default function acquirePage(
	ctx: BrowserContext,
): Effect.Effect<Page, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(() => ctx.newPage()),
		(page) => Effect.ignore(fromPromiseVoid(() => page.close())),
	);
}
