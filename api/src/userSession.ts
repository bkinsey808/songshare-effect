import { Effect } from "effect";
import type { Context } from "hono";
import { verify } from "hono/jwt";

import { sessionCookieName } from "./cookie";
import type { Bindings } from "./env";
import { AuthenticationError } from "./errors";

/**
 * Pure helper - extract the raw token string from a Cookie header value.
 * Returns undefined when the cookie isn't present.
 */
export function extractUserSessionTokenFromCookieHeader(
	cookieHeader: string | undefined,
): string | undefined {
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	// eslint-disable-next-line security/detect-non-literal-regexp
	const re = new RegExp(`${sessionCookieName}=([^;]+)`);
	const match = re.exec(cookie);
	return match && typeof match[1] === "string" && match[1] !== ""
		? match[1]
		: undefined;
}

/**
 * Effect helper - read token from Hono context's Cookie header.
 * Returns an Effect that succeeds with string | undefined.
 */
export const extractUserSessionTokenFromContext = (
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<string | undefined, never> =>
	Effect.sync(() =>
		extractUserSessionTokenFromCookieHeader(ctx.req.header("Cookie")),
	);

/**
 * Verify a JWT token using the provided Bindings for secret lookup.
 * Returns an Effect that yields the verified payload or fails with AuthenticationError.
 */
export const verifyUserSessionToken = (
	userSessionToken: string,
	env: Bindings,
): Effect.Effect<unknown, AuthenticationError> =>
	Effect.tryPromise({
		try: () => verify(userSessionToken, env.JWT_SECRET as string),
		catch: (err: unknown) =>
			new AuthenticationError({
				message: String(err ?? "Invalid token"),
			}),
	});
