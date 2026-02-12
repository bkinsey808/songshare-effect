import { describe, expect, it } from "vitest";

import makeSongLibraryEntry from "@/react/song-library/test-utils/makeSongLibraryEntry.mock";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";

import isSongLibraryEntry from "./guards/isSongLibraryEntry";

/**
 * transformLibraryEntries
 * -----------------------
 * Pure helper that merges rows from three Supabase queries into the
 * shape consumed by the song library slice. This helper is unit tested
 * in isolation to avoid complex Supabase client mocking in the test
 * suite and to comply with repository linting rules.
 */
function transformSongLibraryEntries(
	libraryRows: { song_id: string; song_owner_id: string }[],
	songRows: { song_id: string; song_name?: string; song_slug?: string }[],
	userRows: { user_id: string; username?: string }[],
): Record<string, { song_name?: string; song_slug?: string; owner_username?: string }> {
	const songMap = new Map(
		songRows.map((song) => [
			song.song_id,
			{ song_name: song.song_name, song_slug: song.song_slug },
		]),
	);
	const ownerMap = new Map(userRows.map((user) => [user.user_id, user.username]));

	return libraryRows.reduce<
		Record<string, { song_name?: string; song_slug?: string; owner_username?: string }>
	>((acc, row) => {
		const entry: { song_name?: string; song_slug?: string; owner_username?: string } = {};
		const songDetails = songMap.get(row.song_id);
		const ownerUsername = ownerMap.get(row.song_owner_id);

		if (
			songDetails?.song_name !== null &&
			songDetails?.song_name !== undefined &&
			songDetails.song_name !== ""
		) {
			entry.song_name = songDetails.song_name;
		}
		if (
			songDetails?.song_slug !== null &&
			songDetails?.song_slug !== undefined &&
			songDetails.song_slug !== ""
		) {
			entry.song_slug = songDetails.song_slug;
		}
		if (ownerUsername !== null && ownerUsername !== undefined && ownerUsername !== "") {
			entry.owner_username = ownerUsername;
		}

		acc[row.song_id] = entry;
		return acc;
	}, {});
}

/** Unit tests for the helper */
describe("transformSongLibraryEntries", () => {
	it("combines song library rows with song and owner data", () => {
		const library = [makeSongLibraryEntry({ song_id: "s1", song_owner_id: "u1" })];
		const songs = [makeSongPublic({ song_id: "s1", song_name: "Song 1", song_slug: "song-1" })];
		const owners = [{ user_id: "u1", username: "owner1" }];

		const result = transformSongLibraryEntries(library, songs, owners);

		const EXPECTED_COUNT = 1;
		const keys = Object.keys(result);
		expect(keys).toHaveLength(EXPECTED_COUNT);

		const entry = result["s1"];
		expect(entry).toBeDefined();
		expect(entry?.song_name).toBe("Song 1");
		expect(entry?.owner_username).toBe("owner1");
	});

	it("omits missing song or owner details gracefully", () => {
		const library = [makeSongLibraryEntry({ song_id: "s2", song_owner_id: "u2" })];
		const songs: { song_id: string; song_name?: string; song_slug?: string }[] = []; // empty song rows
		const owners: { user_id: string; username?: string }[] = [];

		const result = transformSongLibraryEntries(library, songs, owners);

		const EXPECTED_COUNT = 1;
		const keys = Object.keys(result);
		expect(keys).toHaveLength(EXPECTED_COUNT);

		const entry = result["s2"];
		expect(entry).toBeDefined();
		expect(entry?.song_name).toBeUndefined();
		expect(entry?.owner_username).toBeUndefined();
	});

	it("filters malformed library rows before transforming", () => {
		const malformed: Record<string, unknown> = { song_owner_id: "u1" };
		const library: unknown[] = [
			malformed,
			makeSongLibraryEntry({ song_id: "s1", song_owner_id: "u1" }),
		];
		const songs = [{ song_id: "s1", song_name: "Song 1", song_slug: "song-1" }];
		const owners = [{ user_id: "u1", username: "owner1" }];

		const filtered = library.filter((row): row is { song_id: string; song_owner_id: string } =>
			isSongLibraryEntry(row),
		);
		const result = transformSongLibraryEntries(filtered, songs, owners);

		const EXPECTED_COUNT = 1;
		const keys = Object.keys(result);
		expect(keys).toHaveLength(EXPECTED_COUNT);
		expect(result["s1"]).toBeDefined();
	});
});
