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
import { SigninErrorToken } from "@/shared/signinTokens";
import { safeGet } from "@/shared/utils/safe";

// Note: state signing is performed using `hono/jwt.sign` below.

/**
 * Effect-based handler for OAuth sign-in initiation.
 * Produces a redirect Response and sets a CSRF cookie.
 */
const oauthSignInFactory = (
	ctx: Context<{ Bindings: Env }>,
): Effect.Effect<Response, AppError> =>
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
								Location: `/${defaultLanguage}/?signinError=${SigninErrorToken.providerUnavailable}`,
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
		const requestOrigin = (() => {
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
			Schema.decodeUnknown(SupportedLanguageSchema)(ctx.req.query("lang"))
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

		// Encode state, include redirect_port if present
		const redirectPort = ctx.req.query("redirect_port");
		yield* $(
			Effect.sync(() =>
				console.log("[oauthSignIn] redirect_port param:", redirectPort),
			),
		);
		const oauthState: OauthState = {
			csrf: csrfState,
			lang,
			provider,
			...(redirectPort !== undefined && redirectPort !== ""
				? { redirect_port: redirectPort }
				: {}),
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
								Location: `/${defaultLanguage}/?signinError=${SigninErrorToken.serverError}`,
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
		// Normalize origin to avoid accidental double slashes.
		// Ensure redirect_uri is absolute (origin + path). If redirectOrigin is
		// empty for some reason fall back to the path-only value, but prefer
		// the absolute origin we derived above.
		const trimmedOrigin = (redirectOrigin ?? "").replace(/\/$/, "");
		const redirect_uri = trimmedOrigin
			? `${trimmedOrigin}${apiOauthCallbackPath ?? ""}`
			: `${apiOauthCallbackPath ?? ""}`;
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
								Location: `/${lang ?? defaultLanguage}/?signinError=${SigninErrorToken.providerUnavailable}`,
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
