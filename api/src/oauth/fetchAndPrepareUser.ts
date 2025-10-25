/* eslint-disable no-console */
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";
import type { Context } from "hono";

import type { Env } from "@/api/env";
import { DatabaseError, ValidationError } from "@/api/errors";
import { fetchAndParseOauthUserData } from "@/api/oauth/fetchAndParseOauthUserData";
import { getUserByEmail } from "@/api/oauth/getUserByEmail";
import { getBackEndProviderData as getProviderData } from "@/api/providers";
import type { UserSchema } from "@/shared/generated/supabaseSchemas";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";
import { apiOauthCallbackPath } from "@/shared/paths";
import type { ProviderType } from "@/shared/providers";
import { safeSet, superSafeGet } from "@/shared/utils/safe";

// Helper: exchange code and prepare supabase + existing user
export function fetchAndPrepareUser(
	ctx: Context<{ Bindings: Env }>,
	code: string,
	provider: ProviderType,
): Effect.Effect<
	{
		supabase: SupabaseClient;
		oauthUserData: OauthUserData;
		existingUser: Schema.Schema.Type<typeof UserSchema> | undefined;
	},
	ValidationError | DatabaseError
> {
	return Effect.gen(function* ($) {
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
					console.log("[oauthCallback] Incoming request headers:", hdrObj);
				} catch (err) {
					console.error(
						"[oauthCallback] Failed to dump incoming headers:",
						String(err),
					);
				}
			}),
		);
		// Build redirectUri for token exchange. Prefer configured OAUTH_REDIRECT_ORIGIN
		// otherwise derive origin from the incoming request so it matches the
		// redirect_uri used in oauthSignIn.
		const requestUrl = new URL(ctx.req.url);
		const envRedirectOrigin = (ctx.env.OAUTH_REDIRECT_ORIGIN ?? "").toString();
		const originForRedirect =
			typeof envRedirectOrigin === "string" && envRedirectOrigin !== ""
				? envRedirectOrigin.replace(/\/$/, "")
				: `${requestUrl.protocol}//${requestUrl.host}`;
		const redirectUri = `${originForRedirect}${ctx.env.OAUTH_REDIRECT_PATH ?? apiOauthCallbackPath}`;
		yield* $(
			Effect.sync(() =>
				console.log("[fetchAndPrepareUser] Using redirectUri:", redirectUri),
			),
		);
		const { accessTokenUrl, clientIdEnvVar, clientSecretEnvVar, userInfoUrl } =
			getProviderData(provider);
		const clientId = superSafeGet(
			ctx.env as unknown as Record<string, string | undefined>,
			clientIdEnvVar,
		);
		const clientSecret = superSafeGet(
			ctx.env as unknown as Record<string, string | undefined>,
			clientSecretEnvVar,
		);

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
						: new DatabaseError({ message: String(err) }),
				),
			),
		);

		const supabase = createClient(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		const existingUser: Schema.Schema.Type<typeof UserSchema> | undefined =
			yield* $(getUserByEmail(supabase, oauthUserData.email));

		return { supabase, oauthUserData, existingUser };
	});
}
