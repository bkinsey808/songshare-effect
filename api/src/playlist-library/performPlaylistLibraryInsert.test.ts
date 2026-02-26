// SupabaseClient type not needed once we use the shared mock

import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";

import performPlaylistLibraryInsert, {
	type PlaylistLibraryRow,
} from "./performPlaylistLibraryInsert";

describe("performPlaylistLibraryInsert", () => {
	const FAKE_USER = "user-1";
	const REQUEST = { playlist_id: "pl-1", playlist_owner_id: "u-2" };

	it("succeeds when supabase returns a row", async () => {
		const inserted: PlaylistLibraryRow = {
			user_id: FAKE_USER,
			playlist_id: REQUEST.playlist_id,
			playlist_owner_id: REQUEST.playlist_owner_id,
			created_at: "2020-01-01T00:00:00Z",
		};

		const client = makeSupabaseClient({
			playlistLibraryInsertRows: [inserted],
		});

		const result = await Effect.runPromise(
			performPlaylistLibraryInsert(client, FAKE_USER, REQUEST),
		);
		expect(result.data).toStrictEqual(inserted);
		expect(result.error).toBeUndefined();
	});

	it("returns DatabaseError when insert throws", async () => {
		const client = makeSupabaseClient({
			playlistLibraryInsertError: new Error("boom"),
		});

		await expect(
			Effect.runPromise(performPlaylistLibraryInsert(client, FAKE_USER, REQUEST)),
		).rejects.toThrow(/boom/);
	});
});
