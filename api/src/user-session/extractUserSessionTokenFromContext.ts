import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractUserSessionTokenFromCookieHeader from "./extractUserSessionTokenFromCookieHeader";

// Ensure the imported function has an explicit function type for the linter
type ExtractCookieFn = (cookieHeader: string | undefined) => string | undefined;
const typedExtractUserSessionTokenFromCookieHeader =
	extractUserSessionTokenFromCookieHeader as ExtractCookieFn;

/**
 * Effect helper — read the session token from the Hono context's Cookie header.
 *
 * This returns an Effect that synchronously extracts the raw cookie value for
 * the configured session cookie and yields the token string when present,
 * or `undefined` when the cookie is missing.
 *
 * @param ctx - Hono request context; used to read the `Cookie` header.
 * @returns An Effect that resolves with the session token string or `undefined`.
 */
export default function extractUserSessionTokenFromContext(
	ctx: ReadonlyContext,
): Effect.Effect<string | undefined> {
	return Effect.sync<string | undefined>(() =>
		typedExtractUserSessionTokenFromCookieHeader(ctx.req.header("Cookie")),
	);
}
