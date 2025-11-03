import { type Context } from "hono";
import { getCookie } from "hono/cookie";

import { getAllowedOrigins, getOriginToCheck } from "./corsUtils";
import { AuthenticationError } from "./errors";
import { csrfTokenCookieName } from "@/shared/cookies";

type EnvLike = Record<string, string | undefined>;

/**
 * Verify that the incoming request comes from an allowed origin.
 *
 * This is a practical CSRF mitigation for state-changing endpoints when a
 * double-submit token is not available. It rejects requests whose Origin
 * or Referer do not match the configured ALLOWED_ORIGINS (or the default
 * dev origins).
 */
export function verifySameOriginOrThrow(ctx: Context): void {
	const envRecord = ctx.env as unknown as EnvLike;
	const allowedOrigins = getAllowedOrigins(envRecord);
	const originToCheck = getOriginToCheck(ctx);

	if (!originToCheck) {
		console.error(
			"CSRF rejection: missing Origin/Referer. allowedOrigins=",
			allowedOrigins,
		);
		throw new AuthenticationError({
			message: "Missing Origin or Referer header",
		});
	}

	if (!allowedOrigins.includes(originToCheck)) {
		// Log details server-side to help debugging allowed origins vs incoming
		console.error("CSRF rejection: origin not allowed", {
			origin: originToCheck,
			allowedOrigins,
		});
		throw new AuthenticationError({
			message: "CSRF validation failed: origin not allowed",
		});
	}

	// Passed checks — considered safe enough for state-changing endpoints
}

/**
 * Validate a double-submit CSRF token: the client must send an
 * `X-CSRF-Token` header whose value matches the readable `csrfTokenCookieName` cookie.
 * Throws AuthenticationError when the header or cookie is missing/mismatched.
 */
export function verifyDoubleSubmitOrThrow(ctx: Context): void {
	const headerToken = ctx.req.header("X-CSRF-Token");
	const cookieToken = getCookie(ctx, csrfTokenCookieName);

	if (typeof headerToken !== "string" || headerToken.length === 0) {
		throw new AuthenticationError({ message: "Missing X-CSRF-Token header" });
	}

	if (typeof cookieToken !== "string" || cookieToken.length === 0) {
		throw new AuthenticationError({ message: "Missing CSRF token cookie" });
	}

	if (headerToken !== cookieToken) {
		throw new AuthenticationError({ message: "Invalid CSRF token" });
	}

	// Passed double-submit check
}
