import { Effect, Schema } from "effect";

import { ProviderError, ValidationError } from "@/api/errors";
import { exchangeCodeForToken } from "@/api/oauth/exchangeCodeForToken";
import type { FetchOpts } from "@/api/oauth/fetchOpts";
import { fetchUserInfo } from "@/api/user/fetchUserInfo";
import {
	type OauthUserData,
	OauthUserDataSchema,
} from "@/shared/oauth/oauthUserData";
import { safeGet } from "@/shared/utils/safe";

/**
 * Exchange an authorization code for tokens, fetch the provider's userinfo
 * endpoint, and validate/normalize the result to the application's
 * `OauthUserData` shape.
 *
 * This helper is used during the OAuth callback flow to turn provider
 * responses into a canonical, validated object the rest of the application
 * can depend on (for example in `oauthCallback`).
 *
 * Behavior / errors:
 * - Performs the token exchange against `opts.accessTokenUrl` and will throw if the exchange fails or returns non-JSON.
 * - Fetches `opts.userInfoUrl` using the returned access or id token and will throw on non-OK responses or invalid JSON.
 * - Normalizes string fields using a safe getter and validates the final object against `OauthUserDataSchema`, throwing if validation fails.
 *
 * Security: uses the shared `safeGet` util to avoid prototype-pollution
 * when reading properties from provider-supplied JSON.
 *
 * @param opts - Fetch options including urls, redirectUri, code, and optional client credentials
 * @returns a validated `OauthUserData` object
 */
export function fetchAndParseOauthUserData(
	opts: FetchOpts,
): Effect.Effect<OauthUserData, ValidationError | ProviderError> {
	return Effect.gen(function* ($) {
		const { accessToken, idToken } = yield* $(
			exchangeCodeForToken(opts).pipe(
				Effect.mapError(
					(err) =>
						new ProviderError({ message: "Token exchange failed", cause: err }),
				),
			),
		);

		const infoRaw = yield* $(
			fetchUserInfo(opts.userInfoUrl, accessToken, idToken).pipe(
				Effect.mapError(
					(err) =>
						new ProviderError({ message: "Userinfo fetch failed", cause: err }),
				),
			),
		);
		const infoObj =
			typeof infoRaw === "object" && infoRaw !== null
				? (infoRaw as Record<string, unknown>)
				: {};

		const getStr = (key: string): string | undefined => {
			const val: unknown = safeGet(infoObj, key as keyof typeof infoObj);
			return typeof val === "string" ? String(val) : undefined;
		};

		const candidate: Partial<OauthUserData> = {
			email: getStr("email") ?? getStr("email_address") ?? "",
			name: getStr("name") ?? getStr("preferred_username") ?? undefined,
			sub: getStr("sub") ?? undefined,
			id: getStr("id") ?? getStr("user_id") ?? undefined,
		};

		const validated = yield* $(
			Schema.decodeUnknown(OauthUserDataSchema)(candidate as unknown).pipe(
				Effect.mapError(
					() => new ValidationError({ message: "Invalid oauth user data" }),
				),
			),
		);
		return validated;
	});
}
