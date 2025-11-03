import { Effect } from "effect";

export function fetchUserInfo(
	userInfoUrl: string,
	accessToken?: string,
	idToken?: string,
): Effect.Effect<unknown, unknown> {
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
				const t = await res.text().catch(() => "<non-text response>");
				console.error(
					"[oauthUserData] Userinfo fetch non-OK response:",
					res.status,
					t,
				);
				throw new Error(`Userinfo fetch failed: ${res.status} ${t}`);
			}

			const jsonRaw = (await res.json().catch(() => undefined)) as unknown;
			if (jsonRaw === undefined) {
				throw new Error("Userinfo returned invalid JSON");
			}
			return jsonRaw;
		},
		catch: (err) => err,
	});
}
