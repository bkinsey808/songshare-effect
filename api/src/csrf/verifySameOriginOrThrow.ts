import { getAllowedOrigins } from "@/api/cors/getAllowedOrigins";
import { getOriginToCheck } from "@/api/cors/getOriginToCheck";
import { AuthenticationError } from "@/api/errors";

import { type ReadonlyContext } from "../hono/hono-context";

export function verifySameOriginOrThrow(ctx: ReadonlyContext): void {
	// Use getAllowedOrigins which accepts `unknown` so callers don't need to
	// perform unsafe casts on `ctx.env`.
	const allowedOrigins = getAllowedOrigins(ctx.env);
	const originToCheck = getOriginToCheck(ctx);

	if (typeof originToCheck !== "string" || originToCheck === "") {
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
