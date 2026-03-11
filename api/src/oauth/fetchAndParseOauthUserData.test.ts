import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import exchangeCodeForToken from "@/api/oauth/exchangeCodeForToken";
import fetchUserInfo from "@/api/user/fetchUserInfo";

import fetchAndParseOauthUserData from "./fetchAndParseOauthUserData";

vi.mock("@/api/oauth/exchangeCodeForToken");
vi.mock("@/api/user/fetchUserInfo");

const OPTS = {
	accessTokenUrl: "https://auth.example.com/token",
	redirectUri: "https://app.example.com/callback",
	code: "auth-code",
	userInfoUrl: "https://auth.example.com/userinfo",
};

describe("fetchAndParseOauthUserData", () => {
	it("returns validated OauthUserData when token exchange and userinfo succeed", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.succeed({ accessToken: "at", idToken: undefined, raw: {} }),
		);
		vi.mocked(fetchUserInfo).mockReturnValue(
			Effect.succeed({
				sub: "sub-123",
				email: "user@example.com",
				name: "Test User",
			}),
		);

		const result = await Effect.runPromise(fetchAndParseOauthUserData(OPTS));

		expect(result).toMatchObject({
			sub: "sub-123",
			email: "user@example.com",
			name: "Test User",
		});
	});

	it("maps email_address to email when email not present", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.succeed({ accessToken: "at", idToken: undefined, raw: {} }),
		);
		vi.mocked(fetchUserInfo).mockReturnValue(
			Effect.succeed({
				sub: "sub-1",
				email_address: "alt@example.com",
			}),
		);

		const result = await Effect.runPromise(fetchAndParseOauthUserData(OPTS));

		expect(result.email).toBe("alt@example.com");
		expect(result.sub).toBe("sub-1");
	});

	it("maps preferred_username to name when name not present", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.succeed({ accessToken: "at", idToken: undefined, raw: {} }),
		);
		vi.mocked(fetchUserInfo).mockReturnValue(
			Effect.succeed({
				sub: "sub-1",
				email: "e@x.com",
				preferred_username: "handle",
			}),
		);

		const result = await Effect.runPromise(fetchAndParseOauthUserData(OPTS));

		expect(result.name).toBe("handle");
		expect(result.email).toBe("e@x.com");
	});

	it("fails with ProviderError when token exchange fails", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.fail(new Error("Token exchange failed")),
		);

		await expect(Effect.runPromise(fetchAndParseOauthUserData(OPTS))).rejects.toThrow(
			/Token exchange failed/,
		);
		expect(fetchUserInfo).not.toHaveBeenCalled();
	});

	it("fails with ProviderError when userinfo fetch fails", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.succeed({ accessToken: "at", idToken: undefined, raw: {} }),
		);
		vi.mocked(fetchUserInfo).mockReturnValue(
			Effect.fail(new Error("Userinfo fetch failed")),
		);

		await expect(Effect.runPromise(fetchAndParseOauthUserData(OPTS))).rejects.toThrow(
			/Userinfo fetch failed/,
		);
	});

	it("succeeds with empty email when userinfo has no email fields", async () => {
		vi.clearAllMocks();
		vi.mocked(exchangeCodeForToken).mockReturnValue(
			Effect.succeed({ accessToken: "at", idToken: undefined, raw: {} }),
		);
		vi.mocked(fetchUserInfo).mockReturnValue(
			Effect.succeed({ sub: "sub-1" }),
		);

		const result = await Effect.runPromise(fetchAndParseOauthUserData(OPTS));

		expect(result.email).toBe("");
		expect(result.sub).toBe("sub-1");
	});
});
