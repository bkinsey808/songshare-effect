import { type Context } from "hono";
import { getCookie } from "hono/cookie";

import { AuthenticationError } from "@/api/api-errors";
import { csrfTokenCookieName } from "@/shared/cookies";

import type { ReadonlyContext } from "../hono/ReadonlyContext.type";

import { type Env } from "../env";

/**
 * Verify double-submit CSRF tokens and throw AuthenticationError on mismatch.
 *
 * @param ctx - Hono request context
 * @returns void
 * @throws AuthenticationError when headers/cookie are missing or do not match
 */
export default function verifyDoubleSubmitOrThrow(ctx: ReadonlyContext): void {
	const headerToken = ctx.req.header("X-CSRF-Token");
	const cookieToken = getCookie(ctx as Context<{ Bindings: Env }>, csrfTokenCookieName);

	if (typeof headerToken !== "string" || headerToken === "") {
		throw new AuthenticationError({ message: "Missing X-CSRF-Token header" });
	}

	if (typeof cookieToken !== "string" || cookieToken === "") {
		throw new AuthenticationError({ message: "Missing CSRF token cookie" });
	}

	if (headerToken !== cookieToken) {
		throw new AuthenticationError({ message: "Invalid CSRF token" });
	}
}
