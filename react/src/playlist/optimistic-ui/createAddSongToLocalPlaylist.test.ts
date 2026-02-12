import { describe, expect, it } from "vitest";

import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";

import makeSetGetForCreateUpdateLocalSongOrder from "../test-utils/makeSetGetForCreateUpdateLocalSongOrder.mock";
import createAddSongToLocalPlaylist from "./createAddSongToLocalPlaylist";

describe("createAddSongToLocalPlaylist", () => {
	it("registers a state updater function when invoked", () => {
		const { set, get, setCalls } = makeSetGetForCreateUpdateLocalSongOrder();

		const handler = createAddSongToLocalPlaylist(set, get);
		handler("song-1");

		const hasFunctionArg = setCalls.some((call) => typeof call === "function");
		expect(hasFunctionArg).toBe(true);
	});

	it("adds song to song_order when not present", () => {
		const { set, get } = makeSetGetForCreateUpdateLocalSongOrder();

		// Initialize helper internal state with a playlist containing the initial song
		set({
			currentPlaylist: makeTestPlaylist({
				playlist_id: "pl-1",
				user_id: "user-1",
				public: {
					playlist_id: "pl-1",
					user_id: "user-1",
					playlist_name: "My Playlist",
					playlist_slug: "my-playlist",
					song_order: ["song-a"],
				},
			}),
		});

		const handler = createAddSongToLocalPlaylist(set, get);
		handler("song-new");

		const stateAfter = get();
		expect(stateAfter.currentPlaylist?.public?.song_order).toStrictEqual(["song-a", "song-new"]);
	});
});
