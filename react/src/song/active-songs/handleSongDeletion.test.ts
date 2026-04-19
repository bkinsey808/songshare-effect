import assert from "node:assert";

import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

import handleSongDeletion from "./handleSongDeletion";

/**
 * Type guard that verifies a value is a `set` updater function that transforms
 * the current `SongSubscribeSlice` into a partial update.
 *
 * @param value - Unknown value to test
 * @returns True when value is an updater function
 */
function isUpdater(
	value: unknown,
): value is (state: Readonly<SongSubscribeSlice>) => Partial<Readonly<SongSubscribeSlice>> {
	return typeof value === "function";
}

describe("handleSongDeletion", () => {
	it("removes the deleted song from publicSongs and activePublicSongIds", () => {
		// Arrange
		const deletedSong = makeSongPublic({ song_id: "song-1", song_slug: "song-1" });
		const keptSong = makeSongPublic({ song_id: "song-2", song_slug: "song-2" });
		const fullState: Readonly<SongSubscribeSlice> = {
			...forceCast<SongSubscribeSlice>({
				addOrUpdatePrivateSongs: vi.fn(),
				addOrUpdatePublicSongs: vi.fn(),
				addActivePrivateSongIds: vi.fn(),
				addActivePublicSongIds: vi.fn(),
				addActivePrivateSongSlugs: vi.fn(),
				addActivePublicSongSlugs: vi.fn(),
				removeActivePrivateSongIds: vi.fn(),
				removeActivePublicSongIds: vi.fn(),
				removeSongsFromCache: vi.fn(),
				subscribeToActivePrivateSongs: vi.fn(),
				subscribeToActivePublicSongs: vi.fn(),
				getSongBySlug: vi.fn(),
			}),
			privateSongs: {},
			publicSongs: {
				[deletedSong.song_id]: deletedSong,
				[keptSong.song_id]: keptSong,
			},
			activePrivateSongIds: [],
			activePublicSongIds: [deletedSong.song_id, keptSong.song_id],
		};
		const set = vi.fn();

		// Act
		handleSongDeletion(deletedSong.song_id, forceCast(set));

		// Assert
		const ARG_INDEX = 0;
		const updaterArg = forceCast<unknown>(set.mock.calls[ARG_INDEX]?.[ARG_INDEX]);
		assert.ok(isUpdater(updaterArg), "expected set to be called with an updater function");
		const partial = updaterArg(fullState);
		expect(partial.publicSongs).toStrictEqual({
			[keptSong.song_id]: keptSong,
		});
		expect(partial.activePublicSongIds).toStrictEqual([keptSong.song_id]);
	});
});
