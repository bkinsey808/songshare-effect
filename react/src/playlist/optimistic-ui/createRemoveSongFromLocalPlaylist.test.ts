import { describe, expect, it } from "vitest";

import makeSetGetForCreateUpdateLocalSongOrder from "../test-utils/makeSetGetForCreateUpdateLocalSongOrder";
import createRemoveSongFromLocalPlaylist from "./createRemoveSongFromLocalPlaylist";

describe("createRemoveSongFromLocalPlaylist", () => {
	it("registers a state updater function when invoked", () => {
		const { set, get, setCalls } = makeSetGetForCreateUpdateLocalSongOrder();

		const handler = createRemoveSongFromLocalPlaylist(set, get);
		handler("song-1");

		const hasFunctionArg = setCalls.some((call) => typeof call === "function");
		expect(hasFunctionArg).toBe(true);
	});

	it("removes song from song_order when present", () => {
		const { set, get } = makeSetGetForCreateUpdateLocalSongOrder();

		// Initialize internal helper state with a playlist that contains the song to remove
		set({
			currentPlaylist: {
				playlist_id: "pl-1",
				user_id: "user-1",
				private_notes: "",
				created_at: "",
				updated_at: "",
				public: {
					playlist_id: "pl-1",
					user_id: "user-1",
					playlist_name: "My Playlist",
					playlist_slug: "my-playlist",
					song_order: ["song-a", "song-b", "song-c"],
				},
			},
		});

		const handler = createRemoveSongFromLocalPlaylist(set, get);
		handler("song-b");

		// The helper applies function updaters to its internal state, so we can
		// read the updated state directly via `get()`.
		const stateAfter = get();
		expect(stateAfter.currentPlaylist?.public?.song_order).toStrictEqual(["song-a", "song-c"]);
	});
});
