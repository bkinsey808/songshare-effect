// src/features/server-utils/oauthCallbackFactory.ts
/* eslint-disable no-console, max-lines-per-function */
import { Effect, Schema } from "effect";
import { type Context } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { nanoid } from "nanoid";

import { buildSameSiteAttr } from "@/api/cookie/buildSameSiteAttr";
import { buildSessionCookie } from "@/api/cookie/buildSessionCookie";
import { registerCookieName, userSessionCookieName } from "@/api/cookie/cookie";
import type { Env } from "@/api/env";
import { DatabaseError, ServerError, ValidationError } from "@/api/errors";
import type { ReadonlyContext } from "@/api/hono/hono-context";
import { buildDashboardRedirectUrl } from "@/api/oauth/buildDashboardRedirectUrl";
import { fetchAndPrepareUser } from "@/api/oauth/fetchAndPrepareUser";
import rateLimit from "@/api/rateLimit";
import { buildRegisterJwt } from "@/api/register/buildRegisterJwt";
import { buildUserSessionJwt } from "@/api/user-session/buildUserSessionJwt";
import { csrfTokenCookieName, oauthCsrfCookieName } from "@/shared/cookies";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { OauthStateSchema } from "@/shared/oauth/oauthState";
import {
	apiOauthCallbackPath,
	dashboardPath,
	registerPath,
} from "@/shared/paths";
import {
	codeQueryParam,
	providerQueryParam,
	signinErrorQueryParam,
	stateQueryParam,
} from "@/shared/queryParams";
import { SigninErrorToken } from "@/shared/signinTokens";

// Local RegisterData type (kept here to avoid module-resolution issues in the
// typechecker while preserving the project's preferred import ordering)

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
			return ctx.redirect(
				`/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.rateLimit}`,
				303,
			);
 * @returns An Effect that yields a `Response` on success or a typed error on
 * failure.
 */
export function oauthCallbackFactory(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext<{ Bindings: Env }>,
): Effect.Effect<Response, DatabaseError | ServerError | ValidationError> {
	return Effect.gen(function* ($) {
		// Rate limit by IP
		const allowed = yield* $(
			Effect.tryPromise({
				try: () => rateLimit(ctx, "oauthCallback"),
				catch: () => new DatabaseError({ message: "Rate limit failed" }),
			}),
		);
		if (!allowed) {
			console.log("[oauthCallback] Rate limit exceeded, not allowed.");
			// Redirect to home with rateLimit token so SPA can show a localized message
			return ctx.redirect(
				`/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.rateLimit}`,
				303,
			);
		}

		const requestUrl = new URL(ctx.req.url);
		// Debug: log full request URL so we can see the hostname the API sees
		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] ctx.req.url:",
					ctx.req.url,
					"requestUrl.href:",
					requestUrl.href,
					"requestUrl.hostname:",
					requestUrl.hostname,
				),
			),
		);
		const code = requestUrl.searchParams.get(codeQueryParam);
		const oauthStateParamsString = requestUrl.searchParams.get(stateQueryParam);
		if (code === null || oauthStateParamsString === null) {
			console.log("[oauthCallback] Missing code or state");
			return new Response(undefined, {
				status: 303,
				headers: {
					Location: `/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.missingData}`,
				},
			});
		}

		// Verify and decode signed state using Effect pipelines so failures map
		// to typed AppError values and we avoid mixing try/catch with Effect.gen.
		const envRecord = ctx.env as unknown as Record<string, string | undefined>;
		const stateSecret = envRecord.STATE_HMAC_SECRET ?? envRecord.JWT_SECRET;
		if (typeof stateSecret !== "string" || stateSecret === "") {
			yield* $(
				Effect.sync(() =>
					console.error(
						"[oauthCallback] Missing STATE_HMAC_SECRET or JWT_SECRET for verifying state",
					),
				),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message:
							"Server misconfiguration: missing state verification secret",
					}),
				),
			);
		}

		const verified = yield* $(
			Effect.tryPromise({
				try: () => verify(oauthStateParamsString, stateSecret as string),
				catch: (err) => new ServerError({ message: String(err) }),
			}),
		);

		const oauthState = yield* $(
			Schema.decodeUnknown(OauthStateSchema)(verified as unknown).pipe(
				Effect.mapError(
					() => new ValidationError({ message: "Invalid state" }),
				),
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
				Effect.sync(() =>
					console.log("[oauthCallback] CSRF validation failed"),
				),
			);
			// Redirect to home with a generic security token so SPA shows a safe message
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
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
		const computedStateRedirectUri = (() => {
			const trimmed = (stateRedirectOrigin ?? "").replace(/\/$/, "");
			let computedRedirectUri = trimmed
				? `${trimmed}${apiOauthCallbackPath ?? ""}`
				: `${apiOauthCallbackPath ?? ""}`;
			if (
				typeof stateRedirectPort === "string" &&
				stateRedirectPort !== "" &&
				(envRecord.ENVIRONMENT ?? "") !== "production"
			) {
				computedRedirectUri = `https://localhost:${stateRedirectPort}${apiOauthCallbackPath ?? ""}`;
			}
			return computedRedirectUri;
		})();

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
			const registerJwt = yield* $(
				buildRegisterJwt({ ctx, oauthUserData, oauthState }),
			);

			yield* $(
				Effect.sync(() =>
					console.log(
						"[oauthCallback] Setting register cookie:",
						registerCookieName,
					),
				),
			);

			yield* $(
				Effect.sync(() => {
					console.log("[oauthCallback] Protocol/secure diagnostics:", {
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
					const clientDebug =
						(ctx.env as unknown as Record<string, string | undefined>)
							.REGISTER_COOKIE_CLIENT_DEBUG === "true";
					const headerValue = clientDebug
						? `${registerCookieName}=${registerJwt}; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureString}`
						: buildSessionCookie({
								ctx,
								name: registerCookieName,
								value: registerJwt,
								opts: {
									maxAge: 604800,
									httpOnly: true,
								},
							});
					ctx.res.headers.append("Set-Cookie", headerValue);
					console.log(
						"[oauthCallback] Set-Cookie header (register):",
						headerValue,
						"clientDebug=",
						clientDebug,
					);
				}),
			);

			yield* $(
				Effect.sync(() =>
					console.log(
						"[oauthCallback] Redirecting to register page:",
						`/${lang}/${registerPath}`,
					),
				),
			);

			// Redirect to register page (303 See Other) using ctx.redirect so
			// previously-set headers (including Set-Cookie) are preserved on the
			// response. Returning a new Response would drop headers attached to ctx.
			return yield* $(
				Effect.sync(() => ctx.redirect(`/${lang}/${registerPath}`, 303)),
			);
		}

		if (
			!Array.isArray(existingUser.linked_providers) ||
			!existingUser.linked_providers.includes(provider)
		) {
			const prov = encodeURIComponent(provider);
			yield* $(
				Effect.sync(() =>
					console.log(
						"[oauthCallback] Provider mismatch, redirecting to signInFailure:",
						provider,
					),
				),
			);
			// Redirect to home with a signinError marker so the SPA can show
			// an inline error banner. Use 303 See Other to force a GET.
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
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
						maxAge: 604800,
						httpOnly: true,
					},
				});
				ctx.res.headers.append("Set-Cookie", headerValue);
				console.log("[oauthCallback] Set-Cookie header:", headerValue);
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
						maxAge: 604800,
						httpOnly: false,
					},
				});
				ctx.res.headers.append("Set-Cookie", csrfHeader);
				console.log(
					"[oauthCallback] Set-Cookie header (csrf-token):",
					csrfHeader,
				);
			}),
		);

		const dashboardRedirectUrl = buildDashboardRedirectUrl({
			ctx,
			url: requestUrl,
			redirectPort: oauthState.redirect_port,
			lang,
			dashboardPath,
		});

		return yield* $(Effect.sync(() => ctx.redirect(dashboardRedirectUrl, 303)));
	});
}
