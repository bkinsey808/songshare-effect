import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import addUserToLibraryHandler from "./addUserToLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

describe("addUserToLibraryHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing followed_user_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/Request must contain followed_user_id/,
		);
	});

	it("fails when followed_user_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: 123 } });

		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/followed_user_id must be a string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when insert returns a non-duplicate error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			userLibraryInsertError: { message: "some other error" },
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/some other error/,
		);
	});

	it("returns existing entry when insert fails with duplicate user_library_pkey (idempotent)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const createdAt = "2026-01-15T12:00:00Z";
		const fakeSupabase = makeSupabaseClient({
			userLibraryInsertError: {
				message: 'duplicate key value violates unique constraint "user_library_pkey"',
			},
			userLibrarySelectRow: {
				created_at: createdAt,
				followed_user_id: "followed-1",
				user_id: SAMPLE_USER_SESSION.user.user_id,
			},
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addUserToLibraryHandler(ctx));

		expect(res).toStrictEqual({
			created_at: createdAt,
			followed_user_id: "followed-1",
			user_id: SAMPLE_USER_SESSION.user.user_id,
		});
	});

	it("returns synthetic success when duplicate but fetch fails", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			userLibraryInsertError: {
				message: 'duplicate key value violates unique constraint "user_library_pkey"',
			},
			userLibrarySelectRow: undefined,
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addUserToLibraryHandler(ctx));

		expect(res.followed_user_id).toBe("followed-1");
		expect(res.user_id).toBe(TEST_USER_ID);
		expect(typeof res.created_at).toBe("string");
	});

	it("fails when insert returns no data", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			userLibraryInsertRows: [undefined],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addUserToLibraryHandler(ctx))).rejects.toThrow(
			/No data returned from insert/,
		);
	});

	it("inserts into user_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { followed_user_id: "followed-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const createdAt = "2026-01-01T00:00:00Z";
		const fakeSupabase = makeSupabaseClient({
			userLibraryInsertRows: [
				{
					created_at: createdAt,
					followed_user_id: "followed-1",
				},
			],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addUserToLibraryHandler(ctx));

		expect(res).toStrictEqual({
			created_at: createdAt,
			followed_user_id: "followed-1",
			user_id: SAMPLE_USER_SESSION.user.user_id,
		});
	});
});
