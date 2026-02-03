import { Effect } from "effect";

import { type FetchOpts } from "@/api/oauth/fetchOpts";
import { codeQueryParam } from "@/shared/queryParams";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Exchange an authorization code for tokens at the provider's token endpoint.
 *
 * Performs a `POST` with `application/x-www-form-urlencoded` body containing
 * `grant_type=authorization_code`, `code`, and `redirect_uri`. When provided,
 * `clientId` and `clientSecret` are included in the body.
 *
 * @param opts - Fetch options including `accessTokenUrl`, `code`, `redirectUri`,
 *   and optional `clientId`/`clientSecret`.
 * @returns - An Effect that resolves to an object containing `accessToken` and
 *   `idToken` (both optional) and the raw JSON response under `raw`. The
 *   Effect fails if the HTTP response is non-OK or if the response JSON is invalid.
 */
export default function exchangeCodeForToken(opts: FetchOpts): Effect.Effect<
	{
		accessToken: string | undefined;
		idToken: string | undefined;
		raw: unknown;
	},
	unknown
> {
	return Effect.tryPromise({
		try: async () => {
			const body = new URLSearchParams();
			body.set("grant_type", "authorization_code");
			body.set(codeQueryParam, opts.code);
			body.set("redirect_uri", opts.redirectUri);
			if (opts.clientId !== undefined) {
				body.set("client_id", opts.clientId);
			}
			if (opts.clientSecret !== undefined) {
				body.set("client_secret", opts.clientSecret);
			}

			const headers = new Headers();
			headers.set("Content-Type", "application/x-www-form-urlencoded");
			headers.set("Accept", "application/json");

			const res = await fetch(opts.accessTokenUrl, {
				method: "POST",
				headers,
				body: body.toString(),
			});

			if (!res.ok) {
				const text = await res.text().catch(() => "<non-text response>");
				console.error("[oauthUserData] Token exchange non-OK response:", res.status, text);
				throw new Error(`Token exchange failed: ${res.status} ${text}`);
			}

			const jsonRaw: unknown = await res.json().catch(() => undefined);
			if (jsonRaw === undefined) {
				throw new Error("Token exchange returned invalid JSON");
			}

			const asRecord = isRecord(jsonRaw) ? jsonRaw : {};
			const accessToken =
				typeof asRecord["access_token"] === "string" ? String(asRecord["access_token"]) : undefined;
			const idToken =
				typeof asRecord["id_token"] === "string" ? String(asRecord["id_token"]) : undefined;
			return { accessToken, idToken, raw: jsonRaw };
		},
		catch: (err) => err,
	});
}
