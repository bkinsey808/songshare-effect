import { Effect } from "effect";

import { ProviderError, ValidationError } from "@/api/errors";
import exchangeCodeForToken from "@/api/oauth/exchangeCodeForToken";
import { type FetchOpts } from "@/api/oauth/fetchOpts";
import fetchUserInfo from "@/api/user/fetchUserInfo";
import { type OauthUserData, OauthUserDataSchema } from "@/shared/oauth/oauthUserData";
import isRecord from "@/shared/type-guards/isRecord";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";

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
export default function fetchAndParseOauthUserData(
	opts: FetchOpts,
): Effect.Effect<OauthUserData, ValidationError | ProviderError> {
	return Effect.gen(function* fetchAndParseOauthUserDataGen($) {
		const { accessToken, idToken } = yield* $(
			exchangeCodeForToken(opts).pipe(
				Effect.mapError(
					(err) => new ProviderError({ message: "Token exchange failed", cause: err }),
				),
			),
		);

		const userInfoRequest: {
			userInfoUrl: string;
			accessToken?: string;
			idToken?: string;
		} = { userInfoUrl: opts.userInfoUrl };
		if (accessToken !== undefined) {
			userInfoRequest.accessToken = accessToken;
		}
		if (idToken !== undefined) {
			userInfoRequest.idToken = idToken;
		}

		const infoRaw = yield* $(
			fetchUserInfo(userInfoRequest).pipe(
				Effect.mapError(
					(err) => new ProviderError({ message: "Userinfo fetch failed", cause: err }),
				),
			),
		);
		const infoObj: Record<string, unknown> = isRecord(infoRaw) ? infoRaw : {};

		function getStr(key: string): string | undefined {
			if (!Object.hasOwn(infoObj, key)) {
				return undefined;
			}
			const val = infoObj[key];
			return typeof val === "string" ? String(val) : undefined;
		}

		const candidate: Partial<OauthUserData> = {
			email: getStr("email") ?? getStr("email_address") ?? "",
			name: getStr("name") ?? getStr("preferred_username") ?? undefined,
			sub: getStr("sub") ?? undefined,
			id: getStr("id") ?? getStr("user_id") ?? undefined,
		};

		const validated = yield* $(
			decodeUnknownEffectOrMap(
				OauthUserDataSchema,
				candidate,
				() => new ValidationError({ message: "Invalid oauth user data" }),
			),
		);
		return validated;
	});
}
