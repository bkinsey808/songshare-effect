import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import fetchAndParseOauthUserData from "@/api/oauth/fetchAndParseOauthUserData";
import getUserByEmail from "@/api/user/getUserByEmail";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchAndPrepareUser from "./fetchAndPrepareUser";

vi.mock("./fetchAndParseOauthUserData");
vi.mock("@/api/user/getUserByEmail");
// oxlint-disable-next-line jest/no-untyped-mock-factory -- mock for external pkg; minimal stub suffices
vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}));

const OAUTH_USER_DATA = {
	sub: "sub-123",
	email: "user@example.com",
	name: "Test User",
};

describe("fetchAndPrepareUser", () => {
	it("returns supabase, oauthUserData, and existingUser when all steps succeed", async () => {
		vi.mocked(fetchAndParseOauthUserData).mockReturnValue(Effect.succeed(OAUTH_USER_DATA));
		vi.mocked(getUserByEmail).mockReturnValue(Effect.succeed(undefined));

		const ctx = makeCtx({
			env: {
				VITE_SUPABASE_URL: "https://supabase.example",
				SUPABASE_SERVICE_KEY: "svc-key",
				OAUTH_REDIRECT_ORIGIN: "https://app.example.com",
				OAUTH_REDIRECT_PATH: "/auth/callback",
				ENVIRONMENT: "development",
			},
			req: { url: "https://app.example.com/auth" },
		});

		const result = await Effect.runPromise(
			fetchAndPrepareUser({
				ctx,
				code: "auth-code",
				provider: "google",
				redirectUri: "https://app.example.com/auth/callback",
			}),
		);

		expect(result.oauthUserData).toStrictEqual(OAUTH_USER_DATA);
		expect(result.existingUser).toBeUndefined();
		expect(result.supabase).toBeDefined();
	});

	it("returns existingUser when getUserByEmail finds a user", async () => {
		const existingUser = forceCast({
			user_id: "user-1",
			email: "user@example.com",
			username: "testuser",
		});

		vi.mocked(fetchAndParseOauthUserData).mockReturnValue(Effect.succeed(OAUTH_USER_DATA));
		vi.mocked(getUserByEmail).mockReturnValue(forceCast(Effect.succeed(existingUser)));

		const ctx = makeCtx({
			env: {
				VITE_SUPABASE_URL: "https://supabase.example",
				SUPABASE_SERVICE_KEY: "svc-key",
				OAUTH_REDIRECT_ORIGIN: "https://app.example.com",
				OAUTH_REDIRECT_PATH: "/auth/callback",
				ENVIRONMENT: "development",
			},
			req: { url: "https://app.example.com/auth" },
		});

		const result = await Effect.runPromise(
			fetchAndPrepareUser({
				ctx,
				code: "auth-code",
				provider: "google",
				redirectUri: "https://app.example.com/auth/callback",
			}),
		);

		expect(result.existingUser).toStrictEqual(existingUser);
	});

	it("fails when fetchAndParseOauthUserData fails", async () => {
		vi.mocked(fetchAndParseOauthUserData).mockReturnValue(
			Effect.fail(new ValidationError({ message: "Token exchange failed" })),
		);

		const ctx = makeCtx({
			env: {
				VITE_SUPABASE_URL: "https://supabase.example",
				SUPABASE_SERVICE_KEY: "svc-key",
				OAUTH_REDIRECT_ORIGIN: "https://app.example.com",
				OAUTH_REDIRECT_PATH: "/auth/callback",
				ENVIRONMENT: "development",
			},
			req: { url: "https://app.example.com/auth" },
		});

		await expect(
			Effect.runPromise(
				fetchAndPrepareUser({
					ctx,
					code: "bad-code",
					provider: "google",
					redirectUri: "https://app.example.com/auth/callback",
				}),
			),
		).rejects.toThrow(/Token exchange failed/);
	});
});
