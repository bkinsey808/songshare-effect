// src/features/server-utils/oauthCallbackFactory.ts
/* eslint-disable no-console, max-lines-per-function */
import { Effect, Schema } from "effect";
import { type Context } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

import { registerCookieName, userSessionCookieName } from "@/api/cookie";
import type { Env } from "@/api/env";
import { DatabaseError, ServerError, ValidationError } from "@/api/errors";
import { getIpAddress } from "@/api/getIpAddress";
import { computeDashboardRedirectWithPort } from "@/api/oauth/computeDashboardRedirectWithPort";
import { createJwt } from "@/api/oauth/createJwt";
import { fetchAndPrepareUser } from "@/api/oauth/fetchAndPrepareUser";
import { resolveUsername } from "@/api/oauth/resolveUsername";
import rateLimit from "@/api/rateLimit";
import { dashboardPath, registerPath } from "@/api/utils/paths";
import { oauthCsrfCookieName } from "@/shared/cookies";
import { defaultLanguage } from "@/shared/language/supportedLanguages";
import { type OauthState, OauthStateSchema } from "@/shared/oauth/oauthState";
import { type OauthUserData } from "@/shared/oauth/oauthUserData";
import { apiOauthCallbackPath } from "@/shared/paths";
import { SigninErrorToken } from "@/shared/signinTokens";
import {
	type UserSessionData as SessionData,
	UserSessionDataSchema as sessionDataSchema,
} from "@/shared/userSessionData";

// Local RegisterData type (kept here to avoid module-resolution issues in the
// typechecker while preserving the project's preferred import ordering)
type RegisterData = {
	readonly oauthUserData: OauthUserData;
	readonly oauthState: OauthState;
};

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
 *   (e.g. Supabase queries, rateLimit failures)
 * - ServerError: server-side misconfiguration and JWT signing/verification
 *   failures
 * - ValidationError: when decoded state or validated session data does not
 *   conform to expected schemas
 *
 * Notes:
 * - The function has side-effects (setting Set-Cookie headers on the Hono
 *   context and performing redirects) but these are all wrapped in Effects.
 * - Callers receive an Effect that, when executed, yields a Response or one
 *   of the typed errors above.
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
				`/${defaultLanguage}/?signinError=${SigninErrorToken.rateLimit}`,
				303,
			) as unknown as Response;
		}

		const url = new URL(ctx.req.url);
		const code = url.searchParams.get("code");
		const oauthStateParamsString = url.searchParams.get("state");
		if (code === null || oauthStateParamsString === null) {
			console.log("[oauthCallback] Missing code or state");
			return new Response(undefined, {
				status: 303,
				headers: {
					Location: `/${defaultLanguage}/?signinError=${SigninErrorToken.missingData}`,
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
								Location: `/${lang}/?signinError=${SigninErrorToken.securityFailed}`,
							},
						}),
				),
			);
		}

		// Build redirectUri used for token exchange. Prefer OAUTH_REDIRECT_ORIGIN when
		// configured (production), otherwise derive origin from the incoming request
		// so the redirect_uri matches what was sent to the provider during sign-in.
		const requestUrl = new URL(ctx.req.url);
		const envRedirectOrigin = (ctx.env.OAUTH_REDIRECT_ORIGIN ?? "").toString();
		const originForRedirect =
			typeof envRedirectOrigin === "string" && envRedirectOrigin !== ""
				? envRedirectOrigin.replace(/\/$/, "")
				: `${requestUrl.protocol}//${requestUrl.host}`;

		const redirectUri = `${originForRedirect}${ctx.env.OAUTH_REDIRECT_PATH ?? apiOauthCallbackPath}`;
		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] redirectUri for token exchange:",
					redirectUri,
				),
			),
		);

		const { supabase, oauthUserData, existingUser } = yield* $(
			fetchAndPrepareUser(ctx, code, provider),
		);
		// Additional debug logging to aid in locating 500 errors during dev
		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] fetchAndPrepareUser completed. existingUser:",
					existingUser ? { user_id: existingUser.user_id } : undefined,
				),
			),
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
		const secure =
			isProd ||
			redirectOrigin.startsWith("https://") ||
			requestProtoIsHttps ||
			forwardedProtoIsHttps;
		const secureFlag = secure ? "Secure;" : "";

		// For localhost dev flows, omit the Domain attribute (setting Domain to
		// "localhost" can cause browsers to ignore the cookie). Use SameSite=Lax
		// for localhost so modern browsers will accept the cookie without the
		// Secure attribute. In non-localhost secure contexts we allow SameSite=None
		// and set Secure when appropriate.
		// Avoid setting Domain for localhost (can cause browsers to ignore cookie).
		const domainAttr = "";

		// Choose SameSite based on environment and security of the request:
		// - In production: prefer SameSite=None when secure (for cross-site scenarios).
		// - In localhost dev: use SameSite=Lax to avoid requiring Secure.
		// - When we detected a secure transport (secureFlag true) and not localhost,
		//   allow SameSite=None so cross-site requests (proxied dev or production) work.
		const sameSiteAttr = (() => {
			// Aggressive dev fix: when running locally with a redirect origin that
			// includes 'localhost' we prefer SameSite=None so the browser will send
			// the session cookie after the OAuth provider redirects back to the
			// app. This is strictly a development convenience and should not be
			// enabled in production.
			if (
				!isProd &&
				(redirectOrigin.includes("localhost") ||
					redirectOrigin.includes("127.0.0.1"))
			) {
				return "SameSite=None;";
			}

			// In secure contexts prefer None to allow cross-site/proxied requests.
			if (secureFlag) {
				return "SameSite=None;";
			}

			// Default to Lax in other non-secure contexts.
			return "SameSite=Lax;";
		})();

		// dashboardRedirectUrl is not assigned yet, will log after assignment below
		if (!existingUser) {
			// User needs registration
			const registerData: RegisterData = { oauthUserData, oauthState };
			const jwtSecret = ctx.env.JWT_SECRET;
			if (typeof jwtSecret !== "string" || jwtSecret === "") {
				yield* $(
					Effect.sync(() =>
						console.error("[oauthCallback] Missing JWT_SECRET"),
					),
				);
				return yield* $(
					Effect.fail(
						new ServerError({
							message: "Server misconfiguration: missing JWT_SECRET",
						}),
					),
				);
			}
			const registerJwt = yield* $(
				createJwt(registerData, jwtSecret as string),
			);
			yield* $(
				Effect.sync(() =>
					// Use SameSite=None so the session cookie is sent on cross-origin
					// requests from the frontend (localhost:5173). Include Secure when
					// appropriate. Note: some browsers require Secure when SameSite=None.
					ctx.header(
						"Set-Cookie",
						`${registerCookieName}=${registerJwt}; HttpOnly; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureFlag}`,
					),
				),
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
				Effect.sync(() =>
					console.log(
						"[oauthCallback] Redirecting to register page:",
						`/${lang}/${registerPath}`,
					),
				),
			);
			// Redirect to register page (303 See Other)
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
							headers: { Location: `/${lang}/${registerPath}` },
						}),
				),
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
								Location: `/${lang}/?signinError=${SigninErrorToken.providerMismatch}&provider=${prov}`,
							},
						}),
				),
			);
		}

		const ip = getIpAddress(ctx);

		// Resolve username from user_public table (source of truth for username)
		const username = yield* $(resolveUsername(supabase, existingUser));
		const finalUsername = username ?? existingUser.name;

		// Create user session JWT
		const sessionData: SessionData = {
			user: existingUser,
			userPublic: {
				user_id: existingUser.user_id,
				username: finalUsername,
			},
			oauthUserData,
			oauthState,
			ip,
		};
		// Validate using Effect Schema (throws if invalid)
		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] Validating sessionData for user:",
					existingUser?.user_id,
				),
			),
		);
		yield* $(
			Schema.decodeUnknown(sessionDataSchema)(sessionData).pipe(
				Effect.mapError(
					(err) =>
						new ValidationError({
							message: String(err?.message ?? "Invalid session"),
						}),
				),
			),
		);

		const jwtSecretFinal = ctx.env.JWT_SECRET;
		if (typeof jwtSecretFinal !== "string" || jwtSecretFinal === "") {
			yield* $(
				Effect.sync(() => console.error("[oauthCallback] Missing JWT_SECRET")),
			);
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing JWT_SECRET",
					}),
				),
			);
		}
		const sessionJwt = yield* $(
			createJwt(sessionData, jwtSecretFinal as string),
		);
		yield* $(
			Effect.sync(() => {
				const headerValue = `${userSessionCookieName}=${sessionJwt}; HttpOnly; Path=/; ${domainAttr} ${sameSiteAttr} Max-Age=604800; ${secureFlag}`;
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
		const buildDashboardRedirectUrl = (): string => {
			let dashboardRedirectUrl = `/${lang}/${dashboardPath}`;
			if (
				oauthState.redirect_port !== undefined &&
				oauthState.redirect_port !== ""
			) {
				const candidate = computeDashboardRedirectWithPort(
					ctx,
					url,
					oauthState.redirect_port,
					lang,
					dashboardPath,
				);
				if (candidate !== undefined) {
					dashboardRedirectUrl = candidate;
				}
			}
			return dashboardRedirectUrl;
		};

		let dashboardRedirectUrl = buildDashboardRedirectUrl();
		// Append a marker so the front-end can detect this came from the OAuth
		// callback and optionally force a fresh /api/me check.
		const hasQuery = dashboardRedirectUrl.includes("?");
		dashboardRedirectUrl = `${dashboardRedirectUrl}${hasQuery ? "&" : "?"}justSignedIn=1`;
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
