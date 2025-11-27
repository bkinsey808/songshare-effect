import { type Context } from "hono";
import { getCookie } from "hono/cookie";

import { AuthenticationError } from "@/api/errors";
import { csrfTokenCookieName } from "@/shared/cookies";

import { type Env } from "../env";
import { type ReadonlyContext } from "../hono/hono-context";

export function verifyDoubleSubmitOrThrow(ctx: ReadonlyContext): void {
	const headerToken = ctx.req.header("X-CSRF-Token");
	const cookieToken = getCookie(
		ctx as Context<{ Bindings: Env }>,
		csrfTokenCookieName,
	);

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
