import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

import addActivePublicSongSlugs from "./addActivePublicSongSlugs";
import fetchPublicSongsBySlugs from "./fetchPublicSongsBySlugs";
import updateStoreWithPublicSongs from "./updateStoreWithPublicSongs";

vi.mock("./fetchPublicSongsBySlugs");
vi.mock("./updateStoreWithPublicSongs");

/**
 * No-op unsubscribe helper used by mocked realtime subscription callbacks.
 *
 * @returns void
 */
function noopUnsubscribe(): void {
	return undefined;
}

describe("addActivePublicSongSlugs", () => {
	it("activates cached public songs even when no fetch is needed", async () => {
		const cachedSong = makeSongPublic({
			song_id: "song-1",
			song_slug: "this-is-a-song",
		});
		const set = vi.fn();
		const state = forceCast<SongSubscribeSlice>({
			activePublicSongIds: [],
			activePublicSongsUnsubscribe: undefined,
			publicSongs: {
				[cachedSong.song_id]: cachedSong,
			},
			subscribeToActivePublicSongs: vi.fn((): (() => void) => noopUnsubscribe),
			addOrUpdatePublicSongs: vi.fn(),
		});
		const get = vi.fn(() => state);
		vi.mocked(updateStoreWithPublicSongs).mockImplementation(({ publicSongsToAdd }) => {
			state.activePublicSongIds = Object.keys(publicSongsToAdd);
			state.activePublicSongsUnsubscribe = noopUnsubscribe;
			return {
				newActivePublicSongIds: Object.keys(publicSongsToAdd),
				activePublicSongsUnsubscribe: noopUnsubscribe,
			};
		});

		await addActivePublicSongSlugs(forceCast(set), get)(["this-is-a-song"]);

		expect(vi.mocked(updateStoreWithPublicSongs)).toHaveBeenCalledWith({
			publicSongsToAdd: {
				[cachedSong.song_id]: cachedSong,
			},
			state,
			set: forceCast(set),
		});
		expect(vi.mocked(fetchPublicSongsBySlugs)).not.toHaveBeenCalled();
	});
});
