import { Effect } from "effect";

import type { ServerError } from "@/api/api-errors";
import type { Env } from "@/api/env";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { registerCookieName } from "@/api/cookie/cookie";
import { debug as serverDebug } from "@/api/logger";
import buildRegisterJwt from "@/api/register/buildRegisterJwt";
import { registerPath } from "@/shared/paths";

import computeCookieAttributes from "./computeCookieAttributes";

// HTTP status codes used in redirects
export const SEE_OTHER = 303;

export type RegistrationRedirectParams = Readonly<{
	ctx: ReadonlyContext;
	envRecord: Env;
	oauthUserData: OauthUserData;
	oauthState: OauthState;
	lang: string;
}>;

/**
 * Handle the "new user" branch of the OAuth callback flow.  This helper lives
 * outside of the main factory to reduce size and make the happy path more
 * readable.
 *
 * It performs the following steps inside an Effect:
 *
 * 1. Build a registration JWT with `buildRegisterJwt`.
 * 2. Emit debug logs for cookie setting and protocol diagnostics.
 * 3. Append either a client-debug cookie header or a normal HttpOnly cookie.
 * 4. Return a 303 response redirecting the browser to the registration page.
 *
 * Any errors from the underlying helpers (e.g. `buildRegisterJwt`) propagate
 * through the returned Effect, matching the union used by
 * `oauthCallbackFactory`.
 */
export default function handleRegistration({
	ctx,
	envRecord,
	oauthUserData,
	oauthState,
	lang,
}: RegistrationRedirectParams): Effect.Effect<Response, ServerError> {
	return Effect.gen(function* registrationGen($) {
		const registerJwt = yield* $(buildRegisterJwt({ ctx, oauthUserData, oauthState }));

		// compute protocol/secure diagnostics used by debug header
		const { domainAttr, sameSiteAttr, secureString } = computeCookieAttributes(ctx);

		yield* $(
			Effect.sync(() => {
				serverDebug("[oauthCallback] Setting register cookie:", registerCookieName);
			}),
		);

		yield* $(
			Effect.sync(() => {
				serverDebug("[oauthCallback] Protocol/secure diagnostics:", {
					// this logger call mirrors the one from the original factory
					// so callers can compare behavior when debugging.
					redirectOrigin: envRecord.OAUTH_REDIRECT_ORIGIN,
					secureString,
					domainAttr,
					sameSiteAttr,
				});

				const clientDebug = envRecord.REGISTER_COOKIE_CLIENT_DEBUG === "true";
				const headerValue = clientDebug
					? `${registerCookieName}=${registerJwt}; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureString}`
					: buildSessionCookie({
							ctx,
							name: registerCookieName,
							value: registerJwt,
							opts: {
								maxAge: 604_800,
								httpOnly: true,
							},
						});
				ctx.res.headers.append("Set-Cookie", headerValue);
				serverDebug(
					"[oauthCallback] Set-Cookie header (register):",
					headerValue,
					"clientDebug=",
					clientDebug,
				);
			}),
		);

		yield* $(
			Effect.sync(() => {
				serverDebug("[oauthCallback] Redirecting to register page:", `/${lang}/${registerPath}`);
			}),
		);

		return ctx.redirect(`/${lang}/${registerPath}`, SEE_OTHER);
	});
}
