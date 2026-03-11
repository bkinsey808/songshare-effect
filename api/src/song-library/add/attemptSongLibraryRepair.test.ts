import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";

import attemptSongLibraryRepair from "./attemptSongLibraryRepair";

describe("attemptSongLibraryRepair", () => {
	const FAKE_USER = "user-1";
	const REQUEST = { song_id: "song-1", song_owner_id: "owner-1" };

	it("returns undefined when song insert fails", async () => {
		const client = makeSupabaseClient({
			songInsertError: new Error("song insert failed"),
		});

		const result = await Effect.runPromise(
			attemptSongLibraryRepair(client, FAKE_USER, REQUEST),
		);

		expect(result).toBeUndefined();
	});

	it("returns undefined when retry insert fails", async () => {
		const client = makeSupabaseClient({
			songInsertRows: [{}],
			songLibraryInsertError: new Error("retry failed"),
		});

		const result = await Effect.runPromise(
			attemptSongLibraryRepair(client, FAKE_USER, REQUEST),
		);

		expect(result).toBeUndefined();
	});

	it("returns library entry when song insert and retry succeed", async () => {
		const libraryRow = {
			created_at: "2026-01-01T00:00:00Z",
			song_id: REQUEST.song_id,
			song_owner_id: REQUEST.song_owner_id,
			user_id: FAKE_USER,
		};

		const client = makeSupabaseClient({
			songInsertRows: [
				{
					song_id: REQUEST.song_id,
					user_id: REQUEST.song_owner_id,
					private_notes: "",
				},
			],
			songLibraryInsertRows: [libraryRow],
		});

		const result = await Effect.runPromise(
			attemptSongLibraryRepair(client, FAKE_USER, REQUEST),
		);

		expect(result).toStrictEqual(libraryRow);
	});
});
