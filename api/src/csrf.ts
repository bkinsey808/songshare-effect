import { type Context } from "hono";
import { getCookie } from "hono/cookie";

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
	const allowedOriginsEnv = envRecord.ALLOWED_ORIGINS;

	const defaultDevOrigins = [
		"http://localhost:5173",
		"http://localhost:5174",
		"https://localhost:5173",
		"https://localhost:5174",
		"http://localhost:3000",
		"https://your-pages-domain.pages.dev",
	];

	const allowedOrigins =
		typeof allowedOriginsEnv === "string" && allowedOriginsEnv.length > 0
			? allowedOriginsEnv
					.split(",")
					.map((rawOrigin) => rawOrigin.trim())
					.filter(Boolean)
			: defaultDevOrigins;

	const originHeader = ctx.req.header("Origin");
	const refererHeader = ctx.req.header("Referer");

	const originToCheck = (() => {
		if (typeof originHeader === "string" && originHeader.length > 0) {
			return originHeader;
		}
		if (typeof refererHeader === "string" && refererHeader.length > 0) {
			try {
				const parsed = new URL(refererHeader);
				return parsed.origin;
			} catch {
				return "";
			}
		}
		return "";
	})();

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
