/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

// Prefer to keep the top-level handler type `Context` — helpers may use ReadonlyContext

import type { Env } from "@/api/env";
import { DatabaseError, ValidationError } from "@/api/errors";
import type { ReadonlyContext } from "@/api/hono/hono-context";
import { fetchAndParseOauthUserData } from "@/api/oauth/fetchAndParseOauthUserData";
import { resolveRedirectOrigin } from "@/api/oauth/resolveRedirectOrigin";
import { getBackEndProviderData } from "@/api/provider/getBackEndProviderData";
import type { ReadonlySupabaseClient } from "@/api/supabase/supabase-client";
import { getUserByEmail } from "@/api/user/getUserByEmail";
import type { UserSchema } from "@/shared/generated/supabaseSchemas";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";
import { apiOauthCallbackPath } from "@/shared/paths";
import type { ProviderType } from "@/shared/providers";
import { safeSet, superSafeGet } from "@/shared/utils/safe";

type FetchAndPrepareUserParams = Readonly<{
	ctx: ReadonlyContext<{ Bindings: Env }>;
	code: string;
	provider: ProviderType;
	redirectUri?: string | undefined;
}>;

// Helper: exchange code and prepare supabase + existing user
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function fetchAndPrepareUser({
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
				} catch (err) {
					console.error(
						"[oauthCallback] Failed to dump incoming headers:",
						String(err),
					);
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
			`${requestUrl.protocol}//${requestUrl.host}`;

		let redirectUri: string;
		if (
			typeof redirectUriFromCaller === "string" &&
			redirectUriFromCaller !== ""
		) {
			redirectUri = redirectUriFromCaller;
		} else {
			const envRedirectOrigin = (
				ctx.env.OAUTH_REDIRECT_ORIGIN ?? ""
			).toString();
			const originForRedirect = resolveRedirectOrigin(
				envRedirectOrigin || undefined,
				{
					requestOrigin: requestOrigin || undefined,
					isProd: (ctx.env.ENVIRONMENT ?? "") === "production",
				},
			);
			redirectUri = `${originForRedirect}${ctx.env.OAUTH_REDIRECT_PATH ?? apiOauthCallbackPath}`;
		}
		yield* $(
			Effect.sync(() =>
				console.log("[fetchAndPrepareUser] Using redirectUri:", redirectUri),
			),
		);
		const { accessTokenUrl, clientIdEnvVar, clientSecretEnvVar, userInfoUrl } =
			getBackEndProviderData(provider);
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
			yield* $(getUserByEmail({ supabase, email: oauthUserData.email }));

		// Additional debug logging to aid in locating 500 errors during dev
		yield* $(
			Effect.sync(() =>
				console.log(
					"[oauthCallback] fetchAndPrepareUser completed. existingUser:",
					existingUser ? { user_id: existingUser.user_id } : undefined,
				),
			),
		);
		return { supabase, oauthUserData, existingUser };
	});
}
