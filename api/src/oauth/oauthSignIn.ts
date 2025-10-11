import { Schema } from "effect";
import type { Context } from "hono";
import { nanoid } from "nanoid";

import type { Env } from "@/api/env";
import { getBackEndProviderData } from "@/api/providers";
import { oauthCsrfCookieName } from "@/shared/cookies";
import {
	SupportedLanguageSchema,
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supportedLanguages";
import type { OauthState } from "@/shared/oauth/oauthState";
import { ProviderSchema, type ProviderType } from "@/shared/providers";
import { safeGet } from "@/shared/utils/safe";

/**
 * Handles OAuth2 sign in redirect.
 * Sets CSRF state cookie and redirects to provider auth URL.
 */
export default async function oauthSignIn(
	ctx: Context<{ Bindings: Env }>,
): Promise<Response> {
	// Parse provider param using Effect Schema decoder
	let provider: ProviderType;
	try {
		provider = Schema.decodeUnknownSync(ProviderSchema)(
			ctx.req.param("provider"),
		);
	} catch {
		// eslint-disable-next-line no-console
		console.log(
			"[oauthSignIn] Invalid provider param:",
			ctx.req.param("provider"),
		);
		return ctx.text("Invalid provider", 400);
	}

	// Generate CSRF state
	const csrfState = nanoid();
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] Generated CSRF state:", csrfState);
	ctx.header(
		"Set-Cookie",
		`${oauthCsrfCookieName}=${csrfState}; HttpOnly; Path=/; Secure; SameSite=Lax`,
	);

	// Determine language (fallback to defaultLanguage)
	let lang: SupportedLanguageType = defaultLanguage;
	try {
		lang = Schema.decodeUnknownSync(SupportedLanguageSchema)(
			ctx.req.query("lang"),
		);
	} catch {
		// ignore and use default
	}
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] Language:", lang);

	// Encode state, include redirect_port if present
	const redirectPort = ctx.req.query("redirect_port");
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] redirect_port param:", redirectPort);
	const oauthState: OauthState = {
		csrf: csrfState,
		lang,
		provider,
		...(redirectPort !== undefined && redirectPort !== ""
			? { redirect_port: redirectPort }
			: {}),
	};
	const oauthStateString = JSON.stringify(oauthState);
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] oauthState:", oauthState);

	// Build redirect URI using OAUTH_REDIRECT_ORIGIN for local and production
	// Access environment vars dynamically (these may not be part of the Env type)
	const envRecord = ctx.env as unknown as Record<string, string | undefined>;
	const redirect_uri = `${envRecord.OAUTH_REDIRECT_ORIGIN ?? ""}${envRecord.OAUTH_REDIRECT_PATH ?? ""}`;
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] redirect_uri:", redirect_uri);

	// Build OAuth URL
	const providerData = getBackEndProviderData(provider);
	const authBaseUrl = providerData.authBaseUrl;
	const clientIdEnvVar = providerData.clientIdEnvVar;
	const client_id = safeGet(envRecord, clientIdEnvVar) ?? "";
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] client_id:", client_id);
	const params = new URLSearchParams({
		client_id,
		redirect_uri,
		response_type: "code",
		scope: "openid email profile",
		state: oauthStateString,
		hl: lang,
	}).toString();
	const authUrl = `${authBaseUrl}?${params}`;
	// eslint-disable-next-line no-console
	console.log("[oauthSignIn] authUrl:", authUrl);

	await Promise.resolve();
	return ctx.redirect(authUrl);
}
