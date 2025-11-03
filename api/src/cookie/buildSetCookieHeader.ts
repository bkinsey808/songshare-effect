import { type Context } from "hono";

import { buildSameSiteAttr } from "@/api/cookie/buildSameSiteAttr";

type EnvLike = Record<string, string | undefined>;

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

	const httpOnlyPart = httpOnly ? "HttpOnly; " : "";
	const headerValue =
		`${name}=${value}; ${httpOnlyPart}Path=/; ${domainAttr}${sameSiteAttr} Max-Age=${maxAge}; ${expires}${secureString}`
			.replace(/\s+/g, " ")
			.trim();

	return headerValue;
}
