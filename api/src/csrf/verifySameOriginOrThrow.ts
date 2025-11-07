import { type Context } from "hono";

import { getAllowedOrigins } from "@/api/cors/getAllowedOrigins";
import { getOriginToCheck } from "@/api/cors/getOriginToCheck";
import { AuthenticationError } from "@/api/errors";

type EnvLike = Record<string, string | undefined>;

export function verifySameOriginOrThrow(ctx: Context): void {
	const envRecord = ctx.env as unknown as EnvLike;
	const allowedOrigins = getAllowedOrigins(envRecord);
	const originToCheck = getOriginToCheck(ctx);

	if (typeof originToCheck !== "string" || originToCheck.length === 0) {
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
