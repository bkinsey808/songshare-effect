import { buildSameSiteAttr } from "@/api/cookie/buildSameSiteAttr";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { getEnvString } from "@/shared/env/getEnv";

type BuildSetCookieHeaderParams = Readonly<{
	ctx: ReadonlyContext;
	name: string;
	value: string;
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }>;
}>;

export function buildSetCookieHeader({
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
