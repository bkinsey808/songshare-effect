import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { warn as serverWarn } from "@/api/logger";
import { ACCESS_CONTROL_MAX_AGE_SEC, HTTP_NO_CONTENT } from "@/shared/constants/http";

import getAllowedOrigins from "../cors/getAllowedOrigins";
import getOriginToCheck from "../cors/getOriginToCheck";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";

/**
 * Headers that the CORS middleware will permit on a cross-origin request.
 * The string is used verbatim in both the response header and the preflight
 * `Access-Control-Allow-Headers` value.
 */
const ALLOWED_HEADERS = "Content-Type, Authorization, X-CSRF-Token";

/**
 * Dynamic CORS middleware (Cloudflare Workers friendly).
 *
 * Reads a comma-separated `ALLOWED_ORIGINS` binding from `ctx.env` and
 * conditionally writes the appropriate CORS response headers when the
 * request origin is permitted. In production the origin must appear in the
 * configured list; in development any truthy `Origin` header is accepted.
 *
 * Preflight (`OPTIONS`) requests are handled specially: a 204 response with
 * CORS headers is returned directly. Non-OPTIONS requests simply call
 * `next()` and return `undefined`.
 *
 * @param ctx - minimal Hono context object; only `env`, `req.header`,
 *   `req.method` and `header` are accessed by this middleware.
 * @param next - downstream middleware continuation function.
 * @returns `Response` when the middleware short-circuits (preflight or
 *   rejected origin), otherwise `undefined` to allow the chain to continue.
 */
export default async function corsMiddleware(
	ctx: ReadonlyContext,
	next: () => Promise<unknown>,
): Promise<Response | undefined> {
	const originHeader = ctx.req.header("Origin");

	const allowedOrigins = getAllowedOrigins(ctx.env);

	/**
	 * The actual origin value the middleware should validate. `getOriginToCheck`
	 * inspects the request context (header or URL for local tests) and returns a
	 * normalized string or `undefined` when no origin is available.  We use this
	 * rather than `originHeader` directly because it handles worker-specific
	 * quirks and testing shortcuts.
	 */
	const originToCheck = getOriginToCheck(ctx);

	const isProd = ctx.env.ENVIRONMENT === "production";
	const originAllowed =
		Boolean(originToCheck) &&
		(isProd ? allowedOrigins.includes(originToCheck) : Boolean(originHeader));

	if (originAllowed && originToCheck) {
		// Only allow the specific origin (do NOT echo '*' when credentials are used)
		ctx.header("Access-Control-Allow-Origin", originToCheck);
		ctx.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
		ctx.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);
		// Allow cookies to be sent from the allowed origin
		ctx.header("Access-Control-Allow-Credentials", "true");
		// Inform caches that responses vary by Origin
		ctx.header("Vary", "Origin");
	}

	// Preflight requests are sent by browsers before a "non-simple" CORS
	// request (e.g. using a method other than GET/POST or with custom headers).
	// The browser expects a 204 response with the appropriate CORS headers
	// so it can decide whether the real request is allowed. We handle those
	// early here and **do not** call `next()` for them.
	if (ctx.req.method === "OPTIONS") {
		if (originAllowed && typeof originHeader === "string") {
			// Return a preflight response that includes the CORS headers we set
			// above. We build an explicit headers object to avoid relying on
			// framework internals when returning early.
			const headers = new Headers();
			headers.set("Access-Control-Allow-Origin", originHeader);
			headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
			headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
			headers.set("Access-Control-Allow-Credentials", "true");
			headers.set("Vary", "Origin");
			// Cache preflight responses for a short time to reduce repeated preflight requests
			headers.set("Access-Control-Max-Age", String(ACCESS_CONTROL_MAX_AGE_SEC));
			return new Response(undefined, { status: HTTP_NO_CONTENT, headers });
		}

		// Origin wasn't allowed — respond without CORS headers so browsers
		// will treat the preflight as failed. Also log for diagnostics.
		serverWarn("CORS preflight rejected for origin:", originHeader);
		return new Response(undefined, { status: HTTP_NO_CONTENT });
	}

	// origin was allowed and this is not a preflight request; just continue
	// the middleware chain. the value returned by `next()` is ignored, and we
	// explicitly return `undefined` so callers know no response has been
	// produced by CORS itself.
	await next();
	return undefined;
}
