import { Effect } from "effect";

/**
 * Fetch user information from an OpenID Connect `userinfo` endpoint.
 *
 * @param params - Parameters for the request.
 * @param params.userInfoUrl - The URL of the `userinfo` endpoint to call.
 * @param params.accessToken - Optional access token to use for authorization.
 * @param params.idToken - Optional ID token to use for authorization when no
 *   access token is provided.
 * @returns - An Effect that resolves to the parsed JSON userinfo object, or
 *   fails with an error when the request or JSON parsing fails.
 */
export default function fetchUserInfo({
	userInfoUrl,
	accessToken,
	idToken,
}: Readonly<{
	userInfoUrl: string;
	accessToken?: string;
	idToken?: string;
}>): Effect.Effect<unknown, unknown> {
	return Effect.tryPromise({
		try: async () => {
			const headers = new Headers();
			headers.set("Accept", "application/json");
			if (accessToken !== undefined) {
				headers.set("Authorization", `Bearer ${accessToken}`);
			} else if (idToken !== undefined) {
				headers.set("Authorization", `Bearer ${idToken}`);
			}

			const res = await fetch(userInfoUrl, { headers });
			if (!res.ok) {
				const text = await res.text().catch(() => "<non-text response>");
				console.error("[oauthUserData] Userinfo fetch non-OK response:", res.status, text);
				throw new Error(`Userinfo fetch failed: ${res.status} ${text}`);
			}

			const jsonRaw: unknown = await res.json().catch(() => undefined);
			if (jsonRaw === undefined) {
				throw new Error("Userinfo returned invalid JSON");
			}
			return jsonRaw;
		},
		catch: (err) => err,
	});
}
