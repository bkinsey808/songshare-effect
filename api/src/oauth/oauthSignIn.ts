/* eslint-disable sonarjs/no-commented-code */
// import { type Context } from "hono";
// import { nanoid } from "nanoid";
// import { parse, safeParse } from "valibot";

// import { Lang, langSchema } from "../../i18n/supportedLangs";
// import {
// 	type ProviderType,
// 	getProviderData,
// 	providerSchema,
// } from "../../providers/provider";
// import { type Env } from "../appContext";
// import { oauthCsrfCookieName } from "../cookie";
// import { type OauthState } from "./oauthState";

// /**
//  * Handles OAuth2 sign in redirect.
//  * Sets CSRF state cookie and redirects to provider auth URL.
//  */
// // eslint-disable-next-line max-lines-per-function
// export default async function oauthSignIn(
// 	c: Context<{ Bindings: Env }>,
// ): Promise<Response> {
// 	// Parse provider
// 	let provider: ProviderType;
// 	try {
// 		provider = parse(providerSchema, c.req.param("provider"));
// 	} catch {
// 		console.log(
// 			"[oauthSignIn] Invalid provider param:",
// 			c.req.param("provider"),
// 		);
// 		return c.text("Invalid provider", 400);
// 	}

// 	// Generate CSRF state
// 	const csrfState = nanoid();
// 	console.log("[oauthSignIn] Generated CSRF state:", csrfState);
// 	c.header(
// 		"Set-Cookie",
// 		`${oauthCsrfCookieName}=${csrfState}; HttpOnly; Path=/; Secure; SameSite=Lax`,
// 	);

// 	// Determine language
// 	const langResult = safeParse(langSchema, c.req.query("lang"));
// 	const lang = langResult.success ? langResult.output : Lang.en;
// 	console.log("[oauthSignIn] Language:", lang);

// 	// Encode state, include redirect_port if present
// 	const redirectPort = c.req.query("redirect_port");
// 	console.log("[oauthSignIn] redirect_port param:", redirectPort);
// 	const oauthState: OauthState = {
// 		csrf: csrfState,
// 		lang,
// 		provider,
// 		...(redirectPort ? { redirect_port: redirectPort } : {}),
// 	};
// 	const oauthStateString = JSON.stringify(oauthState);
// 	console.log("[oauthSignIn] oauthState:", oauthState);

// 	// Build redirect URI using OAUTH_REDIRECT_ORIGIN for local and production
// 	const redirect_uri = `${c.env.OAUTH_REDIRECT_ORIGIN}${c.env.OAUTH_REDIRECT_PATH}`;
// 	console.log("[oauthSignIn] redirect_uri:", redirect_uri);

// 	// Build OAuth URL
// 	const { authBaseUrl, clientIdEnvVar } = getProviderData(provider);
// 	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, security/detect-object-injection
// 	const client_id = c.env[clientIdEnvVar] ?? "";
// 	console.log("[oauthSignIn] client_id:", client_id);
// 	const authUrl =
// 		`${authBaseUrl}?` +
// 		new URLSearchParams({
// 			client_id,
// 			redirect_uri,
// 			response_type: "code",
// 			scope: "openid email profile",
// 			state: oauthStateString,
// 			hl: lang,
// 		}).toString();
// 	console.log("[oauthSignIn] authUrl:", authUrl);

// 	await Promise.resolve();
// 	return c.redirect(authUrl);
// }
