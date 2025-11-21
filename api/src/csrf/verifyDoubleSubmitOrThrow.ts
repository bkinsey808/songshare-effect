import { type Context } from "hono";
import { getCookie } from "hono/cookie";

import { type Env } from "../env";
import { type ReadonlyContext } from "../hono/hono-context";
import { AuthenticationError } from "@/api/errors";
import { csrfTokenCookieName } from "@/shared/cookies";

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function verifyDoubleSubmitOrThrow(ctx: ReadonlyContext): void {
	const headerToken = ctx.req.header("X-CSRF-Token");
	const cookieToken = getCookie(
		ctx as Context<{ Bindings: Env }>,
		csrfTokenCookieName,
	);

	if (typeof headerToken !== "string" || headerToken.length === 0) {
		throw new AuthenticationError({ message: "Missing X-CSRF-Token header" });
	}

	if (typeof cookieToken !== "string" || cookieToken.length === 0) {
		throw new AuthenticationError({ message: "Missing CSRF token cookie" });
	}

	if (headerToken !== cookieToken) {
		throw new AuthenticationError({ message: "Invalid CSRF token" });
	}
}
