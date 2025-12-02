import { Effect } from "effect";
import { verify } from "hono/jwt";

import { sessionCookieName } from "@/api/cookie/cookie";
import { AuthenticationError } from "@/api/errors";
import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { getEnvString } from "@/shared/env/getEnv";

/**
 * Pure helper - extract the raw token string from a Cookie header value.
 * Returns undefined when the cookie isn't present.
 */
export function extractUserSessionTokenFromCookieHeader(
	cookieHeader: string | undefined,
): string | undefined {
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	// Use a named capture group to avoid indexed matches (and thus magic numbers)
	const re = new RegExp(`${sessionCookieName}=(?<val>[^;]+)`);
	const match = re.exec(cookie);
	const value = match?.groups?.val;
	return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Effect helper - read token from Hono context's Cookie header.
 * Returns an Effect that succeeds with string | undefined.
 */
export function extractUserSessionTokenFromContext(
	ctx: ReadonlyContext,
): Effect.Effect<string | undefined> {
	return Effect.sync(() => extractUserSessionTokenFromCookieHeader(ctx.req.header("Cookie")));
}

export function verifyUserSessionToken(
	userSessionToken: string,
	envLike: unknown,
): Effect.Effect<unknown, AuthenticationError> {
	return Effect.tryPromise({
		try: () => {
			const jwtSecret = getEnvString(envLike, "JWT_SECRET");
			if (jwtSecret === undefined || jwtSecret === "") {
				throw new Error("Missing JWT_SECRET");
			}
			return verify(userSessionToken, jwtSecret);
		},
		catch: (err: unknown) =>
			new AuthenticationError({
				message: getErrorMessage(err ?? "Invalid token"),
			}),
	});
}
