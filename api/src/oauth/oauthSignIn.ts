/* eslint-disable no-console */
import { Effect, Schema } from "effect";
import type { Context } from "hono";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";

import type { Env } from "@/api/env";
import { type AppError, ServerError, ValidationError } from "@/api/errors";
import { handleHttpEndpoint } from "@/api/http-utils";
import { getBackEndProviderData } from "@/api/providers";
import { oauthCsrfCookieName } from "@/shared/cookies";
import {
	SupportedLanguageSchema,
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supportedLanguages";
import type { OauthState } from "@/shared/oauth/oauthState";
import { apiOauthCallbackPath } from "@/shared/paths";
import { ProviderSchema, type ProviderType } from "@/shared/providers";
import {
	langQueryParam,
	redirectPortQueryParam,
	signinErrorQueryParam,
} from "@/shared/queryParams";
import { SigninErrorToken } from "@/shared/signinTokens";
import { safeGet } from "@/shared/utils/safe";

// Note: state signing is performed using `hono/jwt.sign` below.

/**
 * Effect-based handler for OAuth sign-in initiation.
 * Produces a redirect Response and sets a CSRF cookie.
 */
// eslint-disable-next-line max-lines-per-function
const oauthSignInFactory = (
	ctx: Context<{ Bindings: Env }>,
): Effect.Effect<Response, AppError> =>
	// eslint-disable-next-line max-lines-per-function
	Effect.gen(function* ($) {
		// Parse provider param using Effect Schema decoder (as an Effect)
		// Parse provider param synchronously and redirect on invalid provider.
		const prov = (() => {
			try {
				return Schema.decodeUnknownSync(ProviderSchema)(
					ctx.req.param("provider"),
				);
			} catch {
				return undefined;
			}
		})();

		if (prov === undefined) {
			// Invalid provider param: redirect to home with providerUnavailable token
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
							headers: {
								Location: `/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.providerUnavailable}`,
							},
						}),
				),
			);
		}

		const provider = prov as unknown as ProviderType;

		// Generate CSRF state and set cookie (wrapped in Effect.sync)
		const csrfState = nanoid();
		yield* $(
			Effect.sync(() =>
				console.log("[oauthSignIn] Generated CSRF state:", csrfState),
			),
		);

		// Determine whether to set the Secure attribute on the cookie.
		const envRecord = ctx.env as unknown as Record<string, string | undefined>;
		const isProd = envRecord.ENVIRONMENT === "production";
		const redirectOriginEnv = envRecord.OAUTH_REDIRECT_ORIGIN ?? "";
		// If OAUTH_REDIRECT_ORIGIN is not configured, derive origin from incoming
		// request so redirect_uri is an absolute URL that matches what the
		// provider will call back to (scheme + host + port).
		// Prefer the browser-supplied Origin header (or Referer) when available --
		// this lets us build a redirect_uri that matches the front-end origin even
		// when the dev proxy forwards an HTTP request to the API. Falling back to
		// the request URL preserves behavior when no headers are present.
		const headerOrigin = ctx.req.header("origin") ?? "";
		const headerReferer =
			ctx.req.header("referer") ?? ctx.req.header("referrer") ?? "";
		const derivedFromReferer = (() => {
			try {
				return headerReferer ? new URL(headerReferer).origin : "";
			} catch {
				return "";
			}
		})();
		const requestOrigin =
			headerOrigin ||
			derivedFromReferer ||
			(() => {
				try {
					return new URL(String(ctx.req.url)).origin;
				} catch {
					return "";
				}
			})();
		const redirectOrigin = redirectOriginEnv || requestOrigin;
		const originIsHttps = redirectOrigin.startsWith("https://");
		const secureAttr = isProd || originIsHttps ? "; Secure" : "";
		yield* $(
			Effect.sync(() =>
				ctx.header(
					"Set-Cookie",
					`${oauthCsrfCookieName}=${csrfState}; HttpOnly; Path=/${secureAttr}; SameSite=Lax`,
				),
			),
		);

		// Determine language (fallback to defaultLanguage) via Effect schema
		const lang = yield* $(
			Schema.decodeUnknown(SupportedLanguageSchema)(
				ctx.req.query(langQueryParam),
			)
				.pipe(
					Effect.mapError(
						() => new ValidationError({ message: "Invalid language" }),
					),
				)
				.pipe(
					Effect.orElse(() =>
						Effect.succeed(defaultLanguage as SupportedLanguageType),
					),
				),
		);
		yield* $(Effect.sync(() => console.log("[oauthSignIn] Language:", lang)));

		// Encode state, include redirect_port if present (we'll read the query
		// param again later when constructing redirect_uri so avoid variable
		// redeclaration issues in the generator scope).
		const oauthState: OauthState = {
			csrf: csrfState,
			lang,
			provider,
			// Note: redirect_port appended later when reading query param again
		};
		yield* $(
			Effect.sync(() => console.log("[oauthSignIn] oauthState:", oauthState)),
		);

		// Sign the state using JWT-style sign. Prefer STATE_HMAC_SECRET, fall back to JWT_SECRET.
		const stateSecret = envRecord.STATE_HMAC_SECRET ?? envRecord.JWT_SECRET;
		if (typeof stateSecret !== "string" || stateSecret === "") {
			// Log and redirect with a generic serverError token
			yield* $(
				Effect.sync(() =>
					console.error(
						"[oauthSignIn] Missing STATE_HMAC_SECRET or JWT_SECRET for signing state",
					),
				),
			);
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
							headers: {
								Location: `/${defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.serverError}`,
							},
						}),
				),
			);
		}

		const signedStateParam = yield* $(
			Effect.tryPromise<string, ServerError>({
				try: () => sign(oauthState, stateSecret as string),
				catch: (err) => new ServerError({ message: String(err) }),
			}),
		);

		// Build redirect URI using apiOauthCallbackPath for local and production.
		// Normalize origin to avoid accidental double slashes. When a redirect_port
		// is provided for developer flows and the origin points at localhost we
		// prefer HTTPS so the provider will redirect back to the HTTPS dev server
		// (mkcert + Vite). This avoids mixed-scheme redirects that can prevent
		// Secure/SameSite=None cookies from being accepted by the browser.
		const trimmedOrigin = (redirectOrigin ?? "").replace(/\/$/, "");
		let redirect_uri = trimmedOrigin
			? `${trimmedOrigin}${apiOauthCallbackPath ?? ""}`
			: `${apiOauthCallbackPath ?? ""}`;

		// If a developer-supplied redirect_port is present and the request targets
		// localhost, force the redirect_uri to https://localhost:PORT so the OAuth
		// provider will redirect back to the HTTPS dev server (mkcert + Vite).
		// This ensures the subsequent Set-Cookie includes Secure when required by
		// browsers for SameSite=None cookies.
		const redirectPortQuery = ctx.req.query(redirectPortQueryParam);
		// Ensure we only treat a defined, non-empty string as a port value.
		if (typeof redirectPortQuery === "string" && redirectPortQuery !== "") {
			// Developer convenience: when a redirect_port is provided prefer HTTPS
			// for localhost. Skip this in production — OAUTH_REDIRECT_ORIGIN should
			// be configured there.
			if ((envRecord.ENVIRONMENT ?? "") !== "production") {
				redirect_uri = `https://localhost:${redirectPortQuery}${apiOauthCallbackPath ?? ""}`;
			}
		}
		yield* $(
			Effect.sync(() =>
				console.log("[oauthSignIn] redirect_uri:", redirect_uri),
			),
		);

		// Build OAuth URL
		const providerData = getBackEndProviderData(provider);
		const authBaseUrl = providerData.authBaseUrl;
		const clientIdEnvVar = providerData.clientIdEnvVar;
		const client_id = safeGet(envRecord, clientIdEnvVar) ?? "";
		if (client_id === "") {
			yield* $(
				Effect.sync(() =>
					console.error(
						`[oauthSignIn] Missing client_id for provider ${provider}`,
					),
				),
			);
			// Redirect user to home with providerUnavailable token
			return yield* $(
				Effect.sync(
					() =>
						new Response(undefined, {
							status: 303,
							headers: {
								Location: `/${lang ?? defaultLanguage}/?${signinErrorQueryParam}=${SigninErrorToken.providerUnavailable}`,
							},
						}),
				),
			);
		}
		yield* $(
			Effect.sync(() => console.log("[oauthSignIn] client_id:", client_id)),
		);
		const params = new URLSearchParams({
			client_id,
			redirect_uri,
			response_type: "code",
			scope: "openid email profile",
			state: signedStateParam,
			hl: lang,
		}).toString();
		const authUrl = `${authBaseUrl}?${params}`;
		yield* $(Effect.sync(() => console.log("[oauthSignIn] authUrl:", authUrl)));

		// Return redirect Response (wrapped in Effect.sync)
		return yield* $(Effect.sync(() => ctx.redirect(authUrl)));
	});

export function oauthSignInHandler(
	ctx: Context<{ Bindings: Env }>,
): Promise<Response> {
	return handleHttpEndpoint((ctxInner: Context<{ Bindings: Env }>) =>
		oauthSignInFactory(ctxInner),
	)(ctx);
}

export default oauthSignInHandler;
