// src/features/server-utils/oauthCallbackFactory.ts
/* eslint-disable no-console, max-lines-per-function */
import { Effect, Schema } from "effect";
import { type Context } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

import { registerCookieName, userSessionCookieName } from "@/api/cookie";
import type { Env } from "@/api/env";
import { DatabaseError, ServerError, ValidationError } from "@/api/errors";
import { buildDashboardRedirectUrl } from "@/api/oauth/buildDashboardRedirectUrl";
import { buildRegisterJwt } from "@/api/oauth/buildRegisterJwt";
import { buildSameSiteAttr } from "@/api/oauth/buildSameSiteAttr";
import { buildUserSessionJwt } from "@/api/oauth/buildUserSessionJwt";
import { fetchAndPrepareUser } from "@/api/oauth/fetchAndPrepareUser";
import rateLimit from "@/api/rateLimit";
import { oauthCsrfCookieName } from "@/shared/cookies";
import { defaultLanguage } from "@/shared/language/supportedLanguages";
import { OauthStateSchema } from "@/shared/oauth/oauthState";
import { dashboardPath, registerPath } from "@/shared/paths";
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
 * @param ctx Hono request context with bound environment variables (`Env`)
 * @returns An Effect that yields a `Response` on success or a typed error on
 * failure.
 */
export function oauthCallbackFactory(
	ctx: Context<{ Bindings: Env }>,
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
		const csrfCookie = getCookie(ctx, oauthCsrfCookieName);
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

		const { supabase, oauthUserData, existingUser } = yield* $(
			fetchAndPrepareUser(ctx, code, provider),
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
				buildRegisterJwt(ctx, oauthUserData, oauthState),
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

					// Use SameSite=None so the session cookie is sent on cross-origin
					// requests from the frontend (localhost:5173). Include Secure when
					// appropriate. Note: some browsers require Secure when SameSite=None.
					const baseHeaderValue = `${registerCookieName}=${registerJwt}; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureString}`;
					// Allow a temporary debug mode to set a non-HttpOnly register cookie so
					// it can be inspected from client-side JS (document.cookie). Only use
					// this in development via the REGISTER_COOKIE_CLIENT_DEBUG env var.
					const clientDebug =
						(ctx.env as unknown as Record<string, string | undefined>)
							.REGISTER_COOKIE_CLIENT_DEBUG === "true";
					const headerValue = clientDebug
						? baseHeaderValue
						: `${registerCookieName}=${registerJwt}; HttpOnly; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureString}`;
					ctx.header("Set-Cookie", headerValue);
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
			buildUserSessionJwt(
				ctx,
				supabase,
				existingUser,
				oauthUserData,
				oauthState,
			),
		);

		yield* $(
			Effect.sync(() => {
				const headerValue = `${userSessionCookieName}=${sessionJwt}; HttpOnly; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureString}`;
				// Set the cookie header and log it for debugging
				ctx.header("Set-Cookie", headerValue);
				console.log("[oauthCallback] Set-Cookie header:", headerValue);
				console.log(
					"[oauthCallback] Setting session cookie:",
					userSessionCookieName,
				);
			}),
		);

		// Client-side redirect to dashboard to ensure cookie is sent before SSR
		// Compute dashboard redirect URL using extracted helper
		// (handles custom port logic and allowed origins)
		const dashboardRedirectUrl = buildDashboardRedirectUrl(
			ctx,
			requestUrl,
			oauthState.redirect_port,
			lang,
			dashboardPath,
		);

		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] Redirecting to dashboard:",
					dashboardRedirectUrl,
				),
			),
		);

		// Use ctx.redirect so headers previously set via ctx.header (including
		// Set-Cookie) are preserved on the response. Returning a freshly
		// constructed Response here would lose the headers attached to ctx.
		return yield* $(Effect.sync(() => ctx.redirect(dashboardRedirectUrl, 303)));
	});
}
