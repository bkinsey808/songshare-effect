/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment */
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { ReadonlyContext } from "@/api/hono/hono-context";
import type { UserSessionData } from "@/shared/userSessionData";

import getUserToken from "./getUserToken";

function makeCtx(): unknown {
	return {
		env: {
			VITE_SUPABASE_URL: "https://supabase.example",
			SUPABASE_SERVICE_KEY: "service-key",
			SUPABASE_VISITOR_EMAIL: "visitor@example.com",
			SUPABASE_VISITOR_PASSWORD: "visitor-pass",
		},
	};
}

const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: "user-123",
	},
	userPublic: { user_id: "user-123", username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("getUserToken", () => {
	it("returns a token when sign-in and metadata update succeed", async () => {
		vi.resetAllMocks();

		// Mock verified session module dynamically and spy on its default export
		const verifiedModule = await import("./getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		// Mock supabase client behavior
		const firstSignInResponse = {
			data: { session: { access_token: undefined }, user: { id: "visitor-1", app_metadata: {} } },
			error: undefined,
		};

		const secondSignInResponse = {
			data: {
				session: { access_token: "fresh-token-abc", expires_in: 3600 },
				user: { id: "visitor-1", app_metadata: { user: { user_id: "user-123" } } },
			},
			error: undefined,
		};

		const mockSignIn = vi
			.fn()
			.mockResolvedValueOnce(firstSignInResponse)
			.mockResolvedValueOnce(secondSignInResponse);
		const mockUpdate = vi.fn().mockResolvedValue({ error: undefined });

		const supabaseModule = await import("@/api/supabase/getSupabaseServerClient");
		vi.spyOn(supabaseModule, "default").mockReturnValue({
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: mockUpdate } },
		} as unknown as ReturnType<typeof supabaseModule.default>);

		const result = await Effect.runPromise(getUserToken(makeCtx() as ReadonlyContext));

		const EXPECTED_SIGNIN_CALLS = 2;
		expect(result).toStrictEqual({
			access_token: "fresh-token-abc",
			token_type: "bearer",
			expires_in: 3600,
		});
		expect(mockSignIn).toHaveBeenCalledTimes(EXPECTED_SIGNIN_CALLS);
		expect(mockUpdate).toHaveBeenCalledWith("visitor-1", {
			app_metadata: {
				user: { user_id: "user-123" },
				userPublic: SAMPLE_USER_SESSION.userPublic,
			},
		});
	});

	it("fails when initial sign-in returns an error", async () => {
		vi.resetAllMocks();
		// Mock verified session module dynamically
		const verifiedModule2 = await import("./getVerifiedSession");
		vi.spyOn(verifiedModule2, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const mockSignIn = vi
			.fn()
			.mockResolvedValueOnce({ data: undefined, error: { message: "bad auth" } });

		const supabaseModule2 = await import("@/api/supabase/getSupabaseServerClient");
		vi.spyOn(supabaseModule2, "default").mockReturnValue({
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: vi.fn() } },
		} as unknown as ReturnType<typeof supabaseModule2.default>);

		await expect(Effect.runPromise(getUserToken(makeCtx() as ReadonlyContext))).rejects.toThrow(
			/Sign in failed: bad auth/,
		);
	});

	it("fails when metadata update returns an error", async () => {
		vi.resetAllMocks();
		// Mock verified session module dynamically
		const verifiedModuleC = await import("./getVerifiedSession");
		vi.spyOn(verifiedModuleC, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const firstSignInResponse = {
			data: { session: { access_token: undefined }, user: { id: "visitor-1", app_metadata: {} } },
			error: undefined as unknown,
		};
		const secondSignInResponse = {
			data: { session: { access_token: "should-not-use" } },
			error: undefined as unknown,
		};

		const mockSignIn = vi
			.fn()
			.mockResolvedValueOnce(firstSignInResponse)
			.mockResolvedValueOnce(secondSignInResponse);

		const mockUpdate = vi.fn().mockResolvedValue({ error: { message: "update failed" } });

		const supabaseModuleC = await import("@/api/supabase/getSupabaseServerClient");
		vi.spyOn(supabaseModuleC, "default").mockReturnValue({
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: mockUpdate } },
		} as unknown as ReturnType<typeof supabaseModuleC.default>);

		await expect(Effect.runPromise(getUserToken(makeCtx() as ReadonlyContext))).rejects.toThrow(
			/update failed/,
		);
	});
});
