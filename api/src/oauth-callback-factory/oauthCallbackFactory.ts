/* oxlint-disable max-lines */
// Localized console usage — prefer per-line exceptions.
import { Effect } from "effect";
import { type Context } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { nanoid } from "nanoid";

import buildSameSiteAttr from "@/api/cookie/buildSameSiteAttr";
import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { registerCookieName, userSessionCookieName } from "@/api/cookie/cookie";
import { type Env } from "@/api/env";
import { DatabaseError, ServerError, ValidationError } from "@/api/errors";
import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { debug as serverDebug, error as serverError } from "@/api/logger";
import rateLimit from "@/api/oauth-callback-factory/rateLimit";
import buildDashboardRedirectUrl from "@/api/oauth/buildDashboardRedirectUrl";
import fetchAndPrepareUser from "@/api/oauth/fetchAndPrepareUser";
import buildRegisterJwt from "@/api/register/buildRegisterJwt";
import { buildUserSessionJwt } from "@/api/user-session/buildUserSessionJwt";
import { csrfTokenCookieName, oauthCsrfCookieName } from "@/shared/cookies";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { OauthStateSchema } from "@/shared/oauth/oauthState";
import { apiOauthCallbackPath, dashboardPath, registerPath } from "@/shared/paths";
import {
	codeQueryParam,
	providerQueryParam,
	signinErrorQueryParam,
	stateQueryParam,
} from "@/shared/queryParams";
import { SigninErrorToken } from "@/shared/signinTokens";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";

// HTTP status codes used in redirects
const SEE_OTHER = 303;

/**
 * Handle the OAuth callback flow.
 *
 * This function performs the full server-side OAuth callback processing:
 * - Rate-limits the incoming request
 * - Verifies the signed OAuth state
 * - Exchanges the provider code for user info and prepares a Supabase client
 * - Looks up or creates a session for the user, issuing a JWT session cookie
 * - Redirects the user to the appropriate post-login URL (dashboard or register)
 *
 * Errors produced by the returned Effect are intentionally narrow and typed:
 * - DatabaseError: failures interacting with DB-backed helpers or rate-limit checks
 * (e.g. Supabase queries, rateLimit failures)
 * - ServerError: server-side misconfiguration and JWT signing/verification
 * failures
 * - ValidationError: when decoded state or validated session data does not
 * conform to expected schemas
 *
 * Notes:
 * - The function has side-effects (setting Set-Cookie headers on the Hono
 * context and performing redirects) but these are all wrapped in Effects.
 * - Callers receive an Effect that, when executed, yields a Response or one
 * of the typed errors above.
 *
 * @returns An Effect that yields a `Response` on success or a typed error on
 * failure.
 */
export default function oauthCallbackFactory(
	ctx: ReadonlyContext,
): Effect.Effect<Response, DatabaseError | ServerError | ValidationError> {
	return Effect.gen(function* rateLimitFn($) {
		// Rate limit by IP
		const allowed = yield* $(
			Effect.tryPromise({
				try: () => rateLimit(ctx, "oauthCallback"),
				catch: () => new DatabaseError({ message: "Rate limit failed" }),
			}),
		);
		if (!allowed) {
			// Localized: server-side debug log for rate limiting
			serverDebug("[oauthCallback] Rate limit exceeded, not allowed.");
			// Redirect to home with rateLimit token so SPA can show a localized message
			return ctx.redirect(
				`/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.rateLimit}`,
				SEE_OTHER,
			);
		}

		const requestUrl = new URL(ctx.req.url);
		// Debug: log full request URL so we can see the hostname the API sees
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug(
					"[oauthCallback] ctx.req.url:",
					ctx.req.url,
					"requestUrl.href:",
					requestUrl.href,
					"requestUrl.hostname:",
					requestUrl.hostname,
				);
			}),
		);
		const code = requestUrl.searchParams.get(codeQueryParam);
		const oauthStateParamsString = requestUrl.searchParams.get(stateQueryParam);
		if (code === null || oauthStateParamsString === null) {
			// Localized: debug-only server-side log
			serverDebug("[oauthCallback] Missing code or state");
			return new Response(undefined, {
				status: SEE_OTHER,
				headers: {
					Location: `/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.missingData}`,
				},
			});
		}

		// Verify and decode signed state using Effect pipelines so failures map
		// to typed AppError values and we avoid mixing try/catch with Effect.gen.
		// `Env` describes the known environment bindings for this service.
		// Cast to `Env` here rather than `unknown` to avoid unsafe wide assertions
		// elsewhere in the function and to make subsequent reads explicit.
		// Use Env type for environment variables
		const envRecord: Env = ctx.env;
		const stateSecret = envRecord.STATE_HMAC_SECRET ?? envRecord.JWT_SECRET;
		if (stateSecret === undefined || stateSecret === null || stateSecret === "") {
			yield* $(
				Effect.sync(() => {
					// Localized: server-side error log
					serverError(
						"[oauthCallback] Missing STATE_HMAC_SECRET or JWT_SECRET for verifying state",
					);
				}),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing state verification secret",
					}),
				),
			);
		}

		const verified = yield* $(
			Effect.tryPromise({
				try: () => verify(oauthStateParamsString, stateSecret, "HS256"),
				catch: (err) => new ServerError({ message: getErrorMessage(err) }),
			}),
		);

		const oauthState = yield* $(
			decodeUnknownEffectOrMap(
				OauthStateSchema,
				verified,
				() => new ValidationError({ message: "Invalid state" }),
			),
		);

		// Destructure language and provider early so we can reference `lang`
		// in error redirect branches below.
		const { lang = defaultLanguage, provider } = oauthState;

		// CSRF validation
		const csrfCookie = getCookie(
			ctx as Context<{
				Bindings: Env;
			}>,
			oauthCsrfCookieName,
		);
		if (csrfCookie === undefined || csrfCookie !== oauthState.csrf) {
			yield* $(
				Effect.sync(() => {
					// Localized: debug-only server-side log
					serverDebug("[oauthCallback] CSRF validation failed");
				}),
			);
			// Redirect to home with a generic security token so SPA shows a safe message
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: SEE_OTHER,
							headers: {
								Location: `/${lang}/?${signinErrorQueryParam}=${SigninErrorToken.securityFailed}`,
							},
						}),
				),
			);
		}

		// Reconstruct the exact redirect_uri used during sign-in from the
		// signed state so the token exchange uses the same value the provider
		// accepted. This avoids relying on incoming request headers which will
		// contain the provider's origin during the callback (e.g. accounts.google.com).
		const stateRedirectPort = oauthState.redirect_port;
		const stateRedirectOrigin = oauthState.redirect_origin ?? "";

		function computeStateRedirectUri(origin: string, port: unknown): string {
			const trimmed = (origin ?? "").replace(/\/$/, "");
			let computedRedirectUri = trimmed
				? trimmed + (apiOauthCallbackPath ?? "")
				: (apiOauthCallbackPath ?? "");
			if (typeof port === "string" && port !== "" && envRecord.ENVIRONMENT !== "production") {
				computedRedirectUri = `https://localhost:${port}${apiOauthCallbackPath ?? ""}`;
			}
			return computedRedirectUri;
		}

		const computedStateRedirectUri = computeStateRedirectUri(
			stateRedirectOrigin,
			stateRedirectPort,
		);

		const { supabase, oauthUserData, existingUser } = yield* $(
			fetchAndPrepareUser({
				ctx,
				code,
				provider,
				redirectUri: computedStateRedirectUri,
			}),
		);

		// Determine Secure flag using environment (avoid relying on process)
		// reuse envRecord declared earlier
		const isProd = envRecord.ENVIRONMENT === "production";
		const redirectOrigin = envRecord.OAUTH_REDIRECT_ORIGIN ?? "";

		// Only include Secure when in production or when we can determine the
		// incoming request used HTTPS. Vite's dev proxy and other proxies may
		// terminate TLS before forwarding, so prefer checking x-forwarded-proto
		// and the request URL protocol in addition to any configured redirect
		// origin. This ensures that in HTTPS dev (mkcert + Vite) we include
		// Secure so browsers accept SameSite=None cookies.
		const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
		const requestProtoIsHttps = requestUrl.protocol === "https:";
		const forwardedProtoIsHttps = headerProto.toLowerCase().startsWith("https");
		const secureFlag =
			isProd ||
			redirectOrigin.startsWith("https://") ||
			requestProtoIsHttps ||
			forwardedProtoIsHttps;
		const secureString = secureFlag ? "Secure;" : "";

		// For localhost dev flows, omit the Domain attribute (setting Domain to
		// "localhost" can cause browsers to ignore the cookie). Use SameSite=Lax
		// for localhost so modern browsers will accept the cookie without the
		// Secure attribute. In non-localhost secure contexts we allow SameSite=None
		// and set Secure when appropriate.
		// Avoid setting Domain for localhost (can cause browsers to ignore cookie).
		const domainAttr = "";

		/**
		 * Choose SameSite attribute for cookies based on environment and security:
		 *
		 * - In production: prefer SameSite=None when secure (for cross-site scenarios).
		 * - In localhost dev: use SameSite=Lax to avoid requiring Secure.
		 * - When a secure transport is detected (secureFlag true) and not localhost,
		 * allow SameSite=None so cross-site requests (proxied dev or production) work.
		 */
		const sameSiteAttr = buildSameSiteAttr({
			isProd,
			redirectOrigin,
			secureFlag,
		});

		// dashboardRedirectUrl is not assigned yet, will log after assignment below
		if (!existingUser) {
			// User needs registration
			const registerJwt = yield* $(buildRegisterJwt({ ctx, oauthUserData, oauthState }));

			yield* $(
				Effect.sync(() => {
					// Localized: debug-only server-side log
					serverDebug("[oauthCallback] Setting register cookie:", registerCookieName);
				}),
			);

			yield* $(
				Effect.sync(() => {
					// Localized: debug-only server-side log
					serverDebug("[oauthCallback] Protocol/secure diagnostics:", {
						requestUrlProtocol: requestUrl.protocol,
						headerProto,
						requestProtoIsHttps,
						forwardedProtoIsHttps,
						secureFlag,
						redirectOrigin,
						isProd,
					});

					// Use helper to build cookie header so attributes match sign-out
					// and other cookie operations across the codebase.
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
					// Localized: debug-only server-side log
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
					// Localized: debug-only server-side log
					serverDebug("[oauthCallback] Redirecting to register page:", `/${lang}/${registerPath}`);
				}),
			);

			// Redirect to register page (303 See Other) using ctx.redirect so
			// previously-set headers (including Set-Cookie) are preserved on the
			// response. Returning a new Response would drop headers attached to ctx.
			return yield* $(Effect.sync(() => ctx.redirect(`/${lang}/${registerPath}`, SEE_OTHER)));
		}

		if (
			!Array.isArray(existingUser.linked_providers) ||
			!existingUser.linked_providers.includes(provider)
		) {
			const prov = encodeURIComponent(provider);
			yield* $(
				Effect.sync(() => {
					// Localized: debug-only server-side log
					serverDebug("[oauthCallback] Provider mismatch, redirecting to signInFailure:", provider);
				}),
			);
			// Redirect to home with a signinError marker so the SPA can show
			// an inline error banner. Use 303 See Other to force a GET.
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: SEE_OTHER,
							headers: {
								Location: `/${lang}/?${signinErrorQueryParam}=${SigninErrorToken.providerMismatch}&${providerQueryParam}=${prov}`,
							},
						}),
				),
			);
		}

		const sessionJwt = yield* $(
			buildUserSessionJwt({
				ctx,
				supabase,
				existingUser,
				oauthUserData,
				oauthState,
			}),
		);

		// Set session cookie header like before and redirect to the dashboard.
		// This is the original, minimal behavior: set the HttpOnly cookie and
		// perform a 303 See Other redirect to the SPA so the browser navigates
		// to the dashboard URL (the cookie was already attached to the response
		// via ctx.header).
		yield* $(
			Effect.sync(() => {
				const headerValue = buildSessionCookie({
					ctx,
					name: userSessionCookieName,
					value: sessionJwt,
					opts: {
						maxAge: 604_800,
						httpOnly: true,
					},
				});
				ctx.res.headers.append("Set-Cookie", headerValue);
				// Localized: debug-only server-side log
				serverDebug("[oauthCallback] Set-Cookie header:", headerValue);
			}),
		);

		// Generate a double-submit CSRF token and set it as a readable cookie
		// so the frontend can include it as `X-CSRF-Token` for protected requests.
		yield* $(
			Effect.sync(() => {
				const csrfToken = nanoid();
				const csrfHeader = buildSessionCookie({
					ctx,
					name: csrfTokenCookieName,
					value: csrfToken,
					opts: {
						maxAge: 604_800,
						httpOnly: false,
					},
				});
				ctx.res.headers.append("Set-Cookie", csrfHeader);
				// Localized: debug-only server-side log
				serverDebug("[oauthCallback] Set-Cookie header (csrf-token):", csrfHeader);
			}),
		);

		const dashboardRedirectUrl = buildDashboardRedirectUrl({
			ctx,
			url: requestUrl,
			redirectPort: oauthState.redirect_port,
			lang,
			dashboardPath,
		});

		return yield* $(Effect.sync(() => ctx.redirect(dashboardRedirectUrl, SEE_OTHER)));
	});
}
