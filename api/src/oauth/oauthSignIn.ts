import { Effect, Schema } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";

import { type AppError, ServerError, ValidationError } from "@/api/errors";
import { handleHttpEndpoint } from "@/api/http/http-utils";
import { debug as serverDebug, error as serverError } from "@/api/logger";
import resolveRedirectOrigin from "@/api/oauth/resolveRedirectOrigin";
import getBackEndProviderData from "@/api/provider/getBackEndProviderData";
import { oauthCsrfCookieName } from "@/shared/cookies";
import { getEnvString } from "@/shared/env/getEnv";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { SupportedLanguageSchema } from "@/shared/language/supported-languages-effect";
import { type OauthState } from "@/shared/oauth/oauthState";
import { apiOauthCallbackPath } from "@/shared/paths";
import { ProviderSchema, type ProviderType } from "@/shared/providers";
import {
	langQueryParam,
	redirectPortQueryParam,
	signinErrorQueryParam,
} from "@/shared/queryParams";
import { SigninErrorToken } from "@/shared/signinTokens";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";

import { type Env } from "../env";
// Removed unused safeGet import
import { type ReadonlyContext } from "../hono/hono-context";

function computeRequestOrigin(reqUrl: string): string {
	try {
		return new URL(reqUrl).origin;
	} catch {
		return "";
	}
}

/**
 * Effect-based handler for OAuth sign-in initiation.
 * Produces a redirect Response and sets a CSRF cookie.
 */
function oauthSignInFactory(ctx: ReadonlyContext): Effect.Effect<Response, AppError> {
	return Effect.gen(function* oauthSignInGen($) {
		// Parse provider param using Effect Schema decoder (as an Effect)
		// Parse provider param synchronously and redirect on invalid provider.
		function computeProv(): ProviderType | undefined {
			try {
				// decodeUnknownSync will return a ProviderType or throw on
				// invalid input. We intentionally catch and return undefined
				// to handle invalid provider params gracefully.
				return Schema.decodeUnknownSync(ProviderSchema)(ctx.req.param("provider"));
			} catch {
				return undefined;
			}
		}

		const prov = computeProv();

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

		// ProviderSchema already validates type via computeProv, so prov
		// is typed as `ProviderType | undefined` and we can narrow to
		// ProviderType here without unsafe assertions.
		const provider = prov;

		// Generate CSRF state and set cookie (wrapped in Effect.sync)
		const csrfState = nanoid();
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] Generated CSRF state:", csrfState);
			}),
		);

		// Determine whether to set the Secure attribute on the cookie.
		// Use a type guard for envRecord to avoid unsafe assertion
		// Use the Env type for environment variables
		// Use Env type for environment variables, no assertion needed
		const envRecord: Env = ctx.env;
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
		const headerReferer = ctx.req.header("referer") ?? ctx.req.header("referrer") ?? "";
		function computeDerivedFromReferer(): string {
			try {
				return headerReferer ? new URL(headerReferer).origin : "";
			} catch {
				return "";
			}
		}
		const derivedFromReferer = computeDerivedFromReferer();

		const requestOrigin =
			headerOrigin || derivedFromReferer || computeRequestOrigin(String(ctx.req.url));
		// Prefer the configured redirect origin, but for localhost in non-
		// production prefer the incoming request origin (so dev can run over
		// either http or https without changing OAUTH_REDIRECT_ORIGIN).
		const isProdFlag = envRecord.ENVIRONMENT === "production";
		const opts = requestOrigin ? { requestOrigin, isProd: isProdFlag } : { isProd: isProdFlag };
		const redirectOrigin = resolveRedirectOrigin(redirectOriginEnv || undefined, opts);
		const originIsHttps = redirectOrigin.startsWith("https://");
		const secureAttr = isProd || originIsHttps ? "; Secure" : "";
		yield* $(
			Effect.sync(() => {
				ctx.header(
					"Set-Cookie",
					`${oauthCsrfCookieName}=${csrfState}; HttpOnly; Path=/${secureAttr}; SameSite=Lax`,
				);
			}),
		);

		// Determine language (fallback to defaultLanguage) via Effect schema
		const lang = yield* $(
			decodeUnknownEffectOrMap(
				SupportedLanguageSchema,
				ctx.req.query(langQueryParam),
				() => new ValidationError({ message: "Invalid language" }),
			).pipe(Effect.orElse(() => Effect.succeed(defaultLanguage))),
		);
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] Language:", lang);
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
			: (apiOauthCallbackPath ?? "");

		// If a developer-supplied redirect_port is present and the request targets
		// localhost, force the redirect_uri to https://localhost:PORT so the OAuth
		// provider will redirect back to the HTTPS dev server (mkcert + Vite).
		// This ensures the subsequent Set-Cookie includes Secure when required by
		// browsers for SameSite=None cookies.
		const redirectPortQuery = ctx.req.query(redirectPortQueryParam);
		// Ensure we only treat a defined, non-empty string as a port value and
		// skip this override in production. When a redirect_port is provided
		// prefer HTTPS for localhost in non-production so the provider will
		// redirect back to the HTTPS dev server (mkcert + Vite).
		if (
			typeof redirectPortQuery === "string" &&
			redirectPortQuery !== "" &&
			envRecord.ENVIRONMENT !== "production"
		) {
			redirect_uri = `https://localhost:${redirectPortQuery}${apiOauthCallbackPath ?? ""}`;
		}

		yield* $(
			Effect.sync(() => {
				serverDebug(
					"[oauthSignIn] redirect_uri aimed at provider:",
					redirect_uri,
					"trimmedOrigin:",
					trimmedOrigin,
				);
			}),
		);

		// Encode state, include redirect_port and redirect_origin so the callback
		// handler can reconstruct the exact redirect_uri used during the initial
		// sign-in request. Having this in the signed state prevents relying on
		// request headers (which during provider redirects contain the provider
		// origin like accounts.google.com) and avoids redirect_uri_mismatch.
		const oauthState: OauthState = {
			csrf: csrfState,
			lang,
			provider,
			redirect_port:
				typeof redirectPortQuery === "string" && redirectPortQuery !== ""
					? redirectPortQuery
					: undefined,
			redirect_origin: trimmedOrigin || undefined,
		};
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] oauthState:", oauthState);
			}),
		);

		// Sign the state using JWT-style sign. Prefer STATE_HMAC_SECRET, fall back to JWT_SECRET.
		const stateSecret = envRecord.STATE_HMAC_SECRET ?? envRecord.JWT_SECRET;
		if (stateSecret === undefined || stateSecret === null || stateSecret === "") {
			// Log and redirect with a generic serverError token
			yield* $(
				Effect.sync(() => {
					// Localized: server-side error log
					serverError("[oauthSignIn] Missing STATE_HMAC_SECRET or JWT_SECRET for signing state");
				}),
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
				try: () => sign(oauthState, stateSecret),
				catch: (err) => new ServerError({ message: extractErrorMessage(err, "Unknown error") }),
			}),
		);

		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] redirect_uri:", redirect_uri);
			}),
		);

		// Build OAuth URL
		const providerData = getBackEndProviderData(provider);
		const { authBaseUrl, clientIdEnvVar } = providerData;
		// Only allow string values for client_id
		// Use a runtime check to ensure clientIdEnvVar is a valid key
		let client_id = "";
		if (typeof clientIdEnvVar === "string") {
			const val = getEnvString(envRecord, clientIdEnvVar);
			if (typeof val === "string") {
				client_id = val;
			}
		}

		if (client_id === "") {
			yield* $(
				Effect.sync(() => {
					// Localized: server-side error log
					serverError(`[oauthSignIn] Missing client_id for provider ${provider}`);
				}),
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
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] client_id:", client_id);
			}),
		);
		const params = new URLSearchParams({
			client_id: String(client_id),
			redirect_uri: String(redirect_uri),
			response_type: "code",
			scope: "openid email profile",
			state: String(signedStateParam),
			hl: String(lang),
		}).toString();
		const authUrl = `${authBaseUrl}?${params}`;
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[oauthSignIn] authUrl:", authUrl);
			}),
		);

		// Return redirect Response (wrapped in Effect.sync)
		return yield* $(Effect.sync(() => ctx.redirect(authUrl)));
	});
}

export function oauthSignInHandler(ctx: ReadonlyContext): Promise<Response> {
	return handleHttpEndpoint((ctxInner: ReadonlyContext) => oauthSignInFactory(ctxInner))(ctx);
}

export default oauthSignInHandler;
