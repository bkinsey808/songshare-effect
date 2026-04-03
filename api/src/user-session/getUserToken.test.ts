import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeSupabaseAppMetadata from "@/shared/test-utils/makeSupabaseAppMetadata.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID, TEST_VISITOR_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import getUserToken from "./getUserToken";

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

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
			data: {
				session: { access_token: undefined },
				user: { id: TEST_VISITOR_ID, app_metadata: {} },
			},
			error: undefined,
		};

		const secondSignInResponse = {
			data: {
				session: { access_token: "fresh-token-abc", expires_in: 3600 },
				user: { id: TEST_VISITOR_ID, app_metadata: makeSupabaseAppMetadata() },
			},
			error: undefined,
		};

		const mockSignIn = vi
			.fn()
			.mockResolvedValueOnce(firstSignInResponse)
			.mockResolvedValueOnce(secondSignInResponse);
		const mockUpdate = vi.fn().mockResolvedValue({ error: undefined });

		const mockClient = {
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: mockUpdate } },
		} as unknown;

		const mockGetSupabaseServerClientSpy = await spyImport(
			"@/api/supabase/getSupabaseServerClient",
		);
		mockGetSupabaseServerClientSpy.mockReturnValue(mockClient);

		const result = await Effect.runPromise(getUserToken(makeCtx()));

		const EXPECTED_SIGNIN_CALLS = 2;
		expect(result).toStrictEqual({
			access_token: "fresh-token-abc",
			token_type: "bearer",
			expires_in: 3600,
		});
		expect(mockSignIn).toHaveBeenCalledTimes(EXPECTED_SIGNIN_CALLS);
		expect(mockUpdate).toHaveBeenCalledWith(TEST_VISITOR_ID, {
			app_metadata: {
				user: { user_id: TEST_USER_ID },
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

		const mockGetSupabaseServerClientSpy = await spyImport(
			"@/api/supabase/getSupabaseServerClient",
		);
		mockGetSupabaseServerClientSpy.mockReturnValue({
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: vi.fn() } },
		} as unknown);

		await expect(Effect.runPromise(getUserToken(makeCtx()))).rejects.toThrow(
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
			data: {
				session: { access_token: undefined },
				user: { id: TEST_VISITOR_ID, app_metadata: {} },
			},
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

		const mockClient = {
			auth: { signInWithPassword: mockSignIn, admin: { updateUserById: mockUpdate } },
		} as unknown;

		const mockGetSupabaseServerClientSpy = await spyImport(
			"@/api/supabase/getSupabaseServerClient",
		);
		mockGetSupabaseServerClientSpy.mockReturnValue(mockClient);

		await expect(Effect.runPromise(getUserToken(makeCtx()))).rejects.toThrow(/update failed/);
	});
});
