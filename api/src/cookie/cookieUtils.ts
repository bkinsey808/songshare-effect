import { type Context } from "hono";

import { buildSameSiteAttr } from "@/api/cookie/buildSameSiteAttr";

type EnvLike = Record<string, string | undefined>;

/**
 * Build a Set-Cookie header value for session/register cookies in a
 * consistent manner across the codebase.
 *
 * ctx is used to inspect env and incoming request headers to decide
 * Secure / SameSite attributes in a manner compatible with the OAuth
 * callback implementation.
 */
export function buildSetCookieHeader(
	ctx: Context,
	name: string,
	value: string,
	opts?: { maxAge?: number; httpOnly?: boolean },
): string {
	const envRecord = ctx.env as unknown as EnvLike;
	const isProd = envRecord.ENVIRONMENT === "production";
	const redirectOrigin = envRecord.OAUTH_REDIRECT_ORIGIN ?? "";

	const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
	const requestUrl = new URL(ctx.req.url);
	const requestProtoIsHttps = requestUrl.protocol === "https:";
	const forwardedProtoIsHttps = headerProto.toLowerCase().startsWith("https");

	const secureFlag =
		isProd ||
		redirectOrigin.startsWith("https://") ||
		requestProtoIsHttps ||
		forwardedProtoIsHttps;
	const secureString = secureFlag ? "Secure;" : "";

	// For localhost dev flows, omit Domain attribute
	const domainAttr = "";

	const sameSiteAttr = buildSameSiteAttr({
		isProd,
		redirectOrigin,
		secureFlag,
	});

	const maxAge =
		typeof opts?.maxAge === "number" ? String(opts?.maxAge) : "604800";
	const httpOnly = opts?.httpOnly !== false;

	const expires =
		opts?.maxAge === 0 ? `Expires=${new Date(0).toUTCString()}; ` : "";

	// Compose header parts carefully and trim excess spaces
	const httpOnlyPart = httpOnly ? "HttpOnly; " : "";
	const headerValue =
		`${name}=${value}; ${httpOnlyPart}Path=/; ${domainAttr}${sameSiteAttr} Max-Age=${maxAge}; ${expires}${secureString}`
			.replace(/\s+/g, " ")
			.trim();

	return headerValue;
}

/**
 * Convenience to build a clearing Set-Cookie header (Max-Age=0) for the
 * named cookie.
 */
export function buildClearCookieHeader(ctx: Context, name: string): string {
	return buildSetCookieHeader(ctx, name, "", { maxAge: 0, httpOnly: true });
}

/**
 * Backwards-compatible helper names requested in the review doc:
 * - `buildSessionCookie` (same as buildSetCookieHeader)
 * - `clearSessionCookie` (same as buildClearCookieHeader)
 */
export const buildSessionCookie = (
	ctx: Context,
	name: string,
	value: string,
	opts?: { maxAge?: number; httpOnly?: boolean },
): string => {
	return buildSetCookieHeader(ctx, name, value, opts);
};

export const clearSessionCookie = (ctx: Context, name: string): string => {
	return buildClearCookieHeader(ctx, name);
};
