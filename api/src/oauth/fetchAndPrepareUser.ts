import { Effect, type Schema } from "effect";

import { DatabaseError, ValidationError } from "@/api/errors";
import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { debug as serverDebug, error as serverError } from "@/api/logger";
import fetchAndParseOauthUserData from "@/api/oauth/fetchAndParseOauthUserData";
import resolveRedirectOrigin from "@/api/oauth/resolveRedirectOrigin";
import getBackEndProviderData from "@/api/provider/getBackEndProviderData";
import { type ReadonlySupabaseClient } from "@/api/supabase/supabase-client";
import getUserByEmail from "@/api/user/getUserByEmail";
import { getEnvString } from "@/shared/env/getEnv";
import { type UserSchema } from "@/shared/generated/supabaseSchemas";
import { type OauthUserData } from "@/shared/oauth/oauthUserData";
import { apiOauthCallbackPath } from "@/shared/paths";
import { type ProviderType } from "@/shared/providers";
import { safeSet } from "@/shared/utils/safe";
import { createClient } from "@supabase/supabase-js";

function computeDerivedFromReferer(referer: string): string {
	try {
		return referer ? new URL(referer).origin : "";
	} catch {
		return "";
	}
}

type FetchAndPrepareUserParams = Readonly<{
	ctx: ReadonlyContext;
	code: string;
	provider: ProviderType;
	redirectUri?: string | undefined;
}>;

// Helper: exchange code and prepare supabase + existing user
export default function fetchAndPrepareUser({
	ctx,
	code,
	provider,
	redirectUri: redirectUriFromCaller,
}: FetchAndPrepareUserParams): Effect.Effect<
	{
		supabase: ReadonlySupabaseClient;
		oauthUserData: OauthUserData;
		existingUser: Schema.Schema.Type<typeof UserSchema> | undefined;
	},
	ValidationError | DatabaseError
> {
	return Effect.gen(function* fetchAndPrepareUserGen($) {
		// Dev-only: dump incoming request headers to help debug Set-Cookie/cookie
		// propagation issues. Guarded as best-effort logging so it never throws.
		yield* $(
			Effect.sync(() => {
				try {
					const names = [
						"host",
						"cookie",
						"referer",
						"user-agent",
						"x-forwarded-proto",
						"x-forwarded-host",
						"x-forwarded-for",
					];
					const hdrObj: Record<string, string | undefined> = {};
					for (const nm of names) {
						safeSet(hdrObj, nm, ctx.req.header(nm) ?? undefined);
					}
				} catch (error) {
					// Localized: server-side error log
					serverError("[oauthCallback] Failed to dump incoming headers:", getErrorMessage(error));
				}
			}),
		);
		// Build redirectUri for token exchange. If the caller provided an exact
		// redirectUri (from the signed OAuth state), prefer that — this ensures
		// we use the identical redirect_uri that was sent to the provider. If
		// not provided, fall back to deriving one from env or incoming request.
		const requestUrl = new URL(ctx.req.url);

		// Prefer the browser-supplied Origin or Referer headers when available so
		// the redirect URI used for token exchange matches the one the provider
		// redirected back to (this is important when the dev proxy terminates TLS
		// and forwards HTTP to the API). Fall back to the request URL origin.
		const headerOrigin = ctx.req.header("origin") ?? "";
		const headerReferer = ctx.req.header("referer") ?? ctx.req.header("referrer") ?? "";

		const derivedFromReferer = computeDerivedFromReferer(headerReferer);
		const requestOrigin =
			headerOrigin || derivedFromReferer || `${requestUrl.protocol}//${requestUrl.host}`;

		let redirectUri = "";
		if (typeof redirectUriFromCaller === "string" && redirectUriFromCaller !== "") {
			redirectUri = redirectUriFromCaller;
		} else {
			const envRedirectOrigin = getEnvString(ctx.env, "OAUTH_REDIRECT_ORIGIN") ?? "";
			const isProdFlag = (getEnvString(ctx.env, "ENVIRONMENT") ?? "") === "production";
			const opts = requestOrigin ? { requestOrigin, isProd: isProdFlag } : { isProd: isProdFlag };
			const originForRedirect = resolveRedirectOrigin(envRedirectOrigin || undefined, opts);
			redirectUri = `${originForRedirect}${getEnvString(ctx.env, "OAUTH_REDIRECT_PATH") ?? apiOauthCallbackPath}`;
		}
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[fetchAndPrepareUser] Using redirectUri:", redirectUri);
			}),
		);
		const { accessTokenUrl, clientIdEnvVar, clientSecretEnvVar, userInfoUrl } =
			getBackEndProviderData(provider);
		// Read env vars via the safe helper (no call-site casting necessary).
		const clientId = getEnvString(ctx.env, clientIdEnvVar) ?? undefined;
		const clientSecret = getEnvString(ctx.env, clientSecretEnvVar) ?? undefined;

		const oauthUserData = yield* $(
			fetchAndParseOauthUserData({
				accessTokenUrl,
				redirectUri,
				code,
				clientId,
				clientSecret,
				userInfoUrl,
			}).pipe(
				Effect.mapError((err) =>
					err instanceof ValidationError
						? err
						: new DatabaseError({ message: getErrorMessage(err) }),
				),
			),
		);

		const supabase = createClient(
			getEnvString(ctx.env, "VITE_SUPABASE_URL") ?? "",
			getEnvString(ctx.env, "SUPABASE_SERVICE_KEY") ?? "",
		);

		const existingUser: Schema.Schema.Type<typeof UserSchema> | undefined = yield* $(
			getUserByEmail({ supabase, email: oauthUserData.email }),
		);

		// Additional debug logging to aid in locating 500 errors during dev
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug(
					"[oauthCallback] fetchAndPrepareUser completed. existingUser:",
					existingUser ? { user_id: existingUser.user_id } : undefined,
				);
			}),
		);
		return { supabase, oauthUserData, existingUser };
	});
}
