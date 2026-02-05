import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import buildSameSiteAttr from "@/api/cookie/buildSameSiteAttr";
import { ZERO } from "@/shared/constants/shared-constants";
import { getEnvString } from "@/shared/env/getEnv";

type BuildSetCookieHeaderParams = Readonly<{
	ctx: ReadonlyContext;
	name: string;
	value: string;
	// With `exactOptionalPropertyTypes` enabled an optional property does not
	// implicitly include `undefined` in its type. Call sites may pass an
	// explicit `undefined` value, so include `| undefined` to accept that
	// form while still allowing callers to omit the property entirely.
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }> | undefined;
}>;

/**
 * Build a Set-Cookie header value for the given cookie parameters.
 *
 * @param ctx - Hono request context used to read environment and request data
 * @param name - Cookie name
 * @param value - Cookie value
 * @param opts - Optional cookie options (maxAge, httpOnly)
 * @returns The full Set-Cookie header value
 */
export default function buildSetCookieHeader({
	ctx,
	name,
	value,
	opts,
}: BuildSetCookieHeaderParams): string {
	// Read env bindings via small helper (avoids call-site casts)
	const isProd = getEnvString(ctx.env, "ENVIRONMENT") === "production";
	const redirectOrigin = getEnvString(ctx.env, "OAUTH_REDIRECT_ORIGIN") ?? "";

	const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
	const requestUrl = new URL(ctx.req.url);
	const requestProtoIsHttps = requestUrl.protocol === "https:";
	const forwardedProtoIsHttps = headerProto.toLowerCase().startsWith("https");

	const secureFlag =
		isProd || redirectOrigin.startsWith("https://") || requestProtoIsHttps || forwardedProtoIsHttps;
	const secureString = secureFlag ? "Secure;" : "";

	// For localhost dev flows, omit Domain attribute
	const domainAttr = "";

	const sameSiteAttr = buildSameSiteAttr({
		isProd,
		redirectOrigin,
		secureFlag,
	});

	const DEFAULT_MAX_AGE_SECONDS = 604_800; // 7 days

	let maxAge = String(DEFAULT_MAX_AGE_SECONDS);
	if (opts !== undefined && typeof opts.maxAge === "number") {
		maxAge = String(opts.maxAge);
	}

	const httpOnly = !(opts !== undefined && opts.httpOnly === false);

	const expires =
		opts !== undefined && opts.maxAge === ZERO ? `Expires=${new Date(ZERO).toUTCString()}; ` : "";

	const httpOnlyPart = httpOnly ? "HttpOnly; " : "";
	const headerValue =
		`${name}=${value}; ${httpOnlyPart}Path=/; ${domainAttr}${sameSiteAttr} Max-Age=${maxAge}; ${expires}${secureString}`
			.split(/\s+/)
			.join(" ")
			.trim();

	return headerValue;
}
