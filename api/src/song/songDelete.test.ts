import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import songDelete from "./songDelete";
import patchSongDelete from "./songDelete.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = TEST_USER_ID;

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({
	user: {
		user_id: SAMPLE_USER_ID,
	},
});

describe("songDelete", () => {
	it("deletes song when payload is valid", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		// patch supabase delete to succeed
		// create an empty object and treat as Supabase client for patching
		const baseClient = {} as unknown;
		const patched = patchSongDelete(baseClient, { data: undefined, error: undefined });
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(songDelete(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing song_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/is missing/);
	});

	it("rejects when song_id is only whitespace", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "   " } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/song_id is required/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not auth" })),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/Not auth/);
	});

	it("fails when Supabase returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		// patch supabase delete to return error
		const baseClient = {} as unknown;
		const patched = patchSongDelete(baseClient, {
			data: undefined,
			error: { message: "delete failed" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/delete failed/);
	});
});
