import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import addPlaylistToLibraryHandler from "./addPlaylistToLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

const VALID_BODY = { playlist_id: "pl-1" };

describe("addPlaylistToLibraryHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(addPlaylistToLibraryHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing playlist_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(addPlaylistToLibraryHandler(ctx))).rejects.toThrow(
			/Request must contain playlist_id/,
		);
	});

	it("fails when playlist_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: 123 } });

		await expect(Effect.runPromise(addPlaylistToLibraryHandler(ctx))).rejects.toThrow(
			/playlist_id must be a string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(addPlaylistToLibraryHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("inserts into playlist_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const createdAt = "2026-01-01T00:00:00Z";
		const fakeSupabase = makeSupabaseClient({
			playlistLibraryInsertRows: [
				{
					created_at: createdAt,
					playlist_id: "pl-1",
				},
			],
			playlistPublicSelectSingleRow: { song_order: [], user_id: "owner-1" },
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addPlaylistToLibraryHandler(ctx));

		expect(res).toStrictEqual({
			created_at: createdAt,
			playlist_id: "pl-1",
			user_id: SAMPLE_USER_SESSION.user.user_id,
			playlist_owner_id: "owner-1",
		});
	});
});
