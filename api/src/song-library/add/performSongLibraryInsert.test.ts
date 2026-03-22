import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";

import performSongLibraryInsert from "./performSongLibraryInsert";

describe("performSongLibraryInsert", () => {
	const FAKE_USER = "user-1";
	const REQUEST = { song_id: "song-1" };

	it("succeeds when supabase returns a row", async () => {
		const inserted = {
			created_at: "2020-01-01T00:00:00Z",
			song_id: REQUEST.song_id,
			user_id: FAKE_USER,
		};

		const client = makeSupabaseClient({
			songLibraryInsertRows: [inserted],
		});

		const result = await Effect.runPromise(performSongLibraryInsert(client, FAKE_USER, REQUEST));
		expect(result.data).toStrictEqual(inserted);
		expect(result.error).toBeNull();
	});

	it("returns DatabaseError when insert throws", async () => {
		const client = makeSupabaseClient({
			songLibraryInsertError: new Error("boom"),
		});

		await expect(
			Effect.runPromise(performSongLibraryInsert(client, FAKE_USER, REQUEST)),
		).rejects.toThrow(/boom/);
	});
});
