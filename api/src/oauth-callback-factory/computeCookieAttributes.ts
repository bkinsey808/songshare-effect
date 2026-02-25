import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import buildSameSiteAttr from "@/api/cookie/buildSameSiteAttr";
import { getEnvString } from "@/shared/env/getEnv";

export type CookieAttrs = Readonly<{
	domainAttr: string;
	sameSiteAttr: string;
	secureString: string;
}>;

/**
 * Compute cookie-related attributes used in OAuth flows.
 *
 * Logic is shared between `oauthCallbackFactory` (mostly for the
 * registration branch) and `registrationRedirect` where the debug cookie
 * header is assembled manually.  We extract it here so the factory can stay
 * lean and the values can be easily unit‑tested.
 */
export default function computeCookieAttributes(ctx: ReadonlyContext): CookieAttrs {
	const isProd = getEnvString(ctx.env, "ENVIRONMENT") === "production";
	const redirectOrigin = getEnvString(ctx.env, "OAUTH_REDIRECT_ORIGIN") ?? "";

	const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
	const requestUrl = new URL(ctx.req.url);
	const requestProtoIsHttps = requestUrl.protocol === "https:";
	const forwardedProtoIsHttps = headerProto.toLowerCase().startsWith("https");

	const secureFlag =
		isProd || redirectOrigin.startsWith("https://") || requestProtoIsHttps || forwardedProtoIsHttps;
	const secureString = secureFlag ? "Secure;" : "";

	// For localhost dev flows we always leave domain empty.
	const domainAttr = "";

	const sameSiteAttr = buildSameSiteAttr({
		isProd,
		redirectOrigin,
		secureFlag,
	});

	return { domainAttr, sameSiteAttr, secureString };
}
