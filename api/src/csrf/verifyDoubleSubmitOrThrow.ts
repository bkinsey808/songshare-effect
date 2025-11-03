import { type Context } from "hono";
import { getCookie } from "hono/cookie";

import { AuthenticationError } from "../errors";
import { csrfTokenCookieName } from "@/shared/cookies";

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
