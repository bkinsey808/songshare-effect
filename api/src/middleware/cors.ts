import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ACCESS_CONTROL_MAX_AGE_SEC, HTTP_NO_CONTENT } from "@/shared/constants/http";

import getAllowedOrigins from "../cors/getAllowedOrigins";
import getOriginToCheck from "../cors/getOriginToCheck";

/**
 * Dynamic CORS middleware (Cloudflare Workers friendly).
 * Reads comma-separated ALLOWED_ORIGINS from bindings (ctx.env.ALLOWED_ORIGINS)
 * Falls back to local dev origins when not provided.
 */
export default async function corsMiddleware(
	ctx: ReadonlyContext,
	next: () => Promise<unknown>,
): Promise<Response | undefined> {
	const originHeader = ctx.req.header("Origin");

	const allowedOrigins = getAllowedOrigins(ctx.env);
	const originToCheck = getOriginToCheck(ctx);

	const allowedMethods = "GET, POST, PUT, DELETE, OPTIONS";
	const allowedHeaders = "Content-Type, Authorization, X-CSRF-Token";

	const isProd = ctx.env.ENVIRONMENT === "production";
	const originAllowed =
		Boolean(originToCheck) &&
		(isProd ? allowedOrigins.includes(originToCheck) : Boolean(originHeader));

	if (originAllowed && originToCheck) {
		// Only allow the specific origin (do NOT echo '*' when credentials are used)
		ctx.header("Access-Control-Allow-Origin", originToCheck);
		ctx.header("Access-Control-Allow-Methods", allowedMethods);
		ctx.header("Access-Control-Allow-Headers", allowedHeaders);
		// Allow cookies to be sent from the allowed origin
		ctx.header("Access-Control-Allow-Credentials", "true");
		// Inform caches that responses vary by Origin
		ctx.header("Vary", "Origin");
	}

	// Preflight
	if (ctx.req.method === "OPTIONS") {
		if (originAllowed && typeof originHeader === "string") {
			// Return a preflight response that includes the CORS headers we set
			// above. We build an explicit headers object to avoid relying on
			// framework internals when returning early.
			const headers = new Headers();
			headers.set("Access-Control-Allow-Origin", originHeader);
			headers.set("Access-Control-Allow-Methods", allowedMethods);
			headers.set("Access-Control-Allow-Headers", allowedHeaders);
			headers.set("Access-Control-Allow-Credentials", "true");
			headers.set("Vary", "Origin");
			// Cache preflight responses for a short time to reduce repeated preflight requests
			headers.set("Access-Control-Max-Age", String(ACCESS_CONTROL_MAX_AGE_SEC));
			return new Response(undefined, { status: HTTP_NO_CONTENT, headers });
		}

		// Origin wasn't allowed — respond without CORS headers so browsers
		// will treat the preflight as failed. Also log for diagnostics.
		console.warn("CORS preflight rejected for origin:", originHeader);
		return new Response(undefined, { status: HTTP_NO_CONTENT });
	}

	await next();
	return undefined;
}
