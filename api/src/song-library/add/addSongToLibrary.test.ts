import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import addSongToLibraryHandler from "./addSongToLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

const VALID_BODY = { song_id: "song-1" };

describe("addSongToLibraryHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(addSongToLibraryHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing song_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(addSongToLibraryHandler(ctx))).rejects.toThrow(
			/Request must contain song_id/,
		);
	});

	it("fails when song_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: 123 } });

		await expect(Effect.runPromise(addSongToLibraryHandler(ctx))).rejects.toThrow(
			/song_id must be a string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(addSongToLibraryHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("inserts into song_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const createdAt = "2026-01-01T00:00:00Z";
		const fakeSupabase = makeSupabaseClient({
			songLibraryInsertRows: [
				{
					created_at: createdAt,
					song_id: "song-1",
				},
			],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addSongToLibraryHandler(ctx));

		expect(res).toStrictEqual({
			created_at: createdAt,
			song_id: "song-1",
			user_id: SAMPLE_USER_SESSION.user.user_id,
		});
	});
});
