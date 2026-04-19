import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongPublic } from "@/react/song/song-schema";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

import getCachedPublicSongsToActivate from "./getCachedPublicSongsToActivate";

const SONG_A = makeSongPublic({ song_id: "id-a", song_slug: "slug-a" });
const SONG_B = makeSongPublic({ song_id: "id-b", song_slug: "slug-b" });
const SONG_C = makeSongPublic({ song_id: "id-c", song_slug: "slug-c" });
const PUBLIC_SONGS: Record<string, SongPublic> = {
	"id-a": SONG_A,
	"id-b": SONG_B,
	"id-c": SONG_C,
};

/**
 * Build the minimal song subscription slice state needed by this utility.
 *
 * @param publicSongs - Optional public song cache override
 * @param activePublicSongIds - Optional active public song ids override
 * @returns Song subscription slice test fixture
 */
function makeState({
	publicSongs = PUBLIC_SONGS,
	activePublicSongIds = [],
}: {
	publicSongs?: Record<string, SongPublic>;
	activePublicSongIds?: readonly string[];
} = {}): SongSubscribeSlice {
	return forceCast<SongSubscribeSlice>({
		publicSongs,
		activePublicSongIds,
	});
}

describe("getCachedPublicSongsToActivate", () => {
	it("returns requested cached public songs that are not already active", () => {
		// Arrange
		const state = makeState({ activePublicSongIds: ["id-b"] });

		// Act
		const result = getCachedPublicSongsToActivate(state, ["slug-a", "slug-b", "slug-c"]);

		// Assert
		expect(result).toStrictEqual({
			"id-a": SONG_A,
			"id-c": SONG_C,
		});
	});

	it.each([
		{
			name: "no cached public songs match the requested slugs",
			state: makeState(),
			songSlugs: ["slug-missing"],
		},
		{
			name: "every matching cached public song is already active",
			state: makeState({ activePublicSongIds: ["id-a", "id-c"] }),
			songSlugs: ["slug-a", "slug-c"],
		},
	])("returns an empty object when $name", ({ state, songSlugs }) => {
		// Arrange
		const arrangedState = state;

		// Act
		const result = getCachedPublicSongsToActivate(arrangedState, songSlugs);

		// Assert
		expect(result).toStrictEqual({});
	});
});
