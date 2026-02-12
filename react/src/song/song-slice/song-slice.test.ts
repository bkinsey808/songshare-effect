import { describe, expect, it, vi } from "vitest";

import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";

import type { SongPublic } from "../song-schema";

import makeSongTestSlice from "./makeSongTestSlice.mock";

function makeTestSlice(): ReturnType<typeof makeSongTestSlice> {
	return makeSongTestSlice();
}

describe("createSongSubscribeSlice", () => {
	it("adds and merges private songs with addOrUpdatePrivateSongs", () => {
		const { slice, getState } = makeTestSlice();

		const s1 = { song_id: "s1", created_at: "t", updated_at: "t" };
		const s2 = { song_id: "s2", created_at: "t", updated_at: "t" };

		slice.addOrUpdatePrivateSongs({ s1 });
		expect(getState().privateSongs["s1"]).toBeDefined();

		slice.addOrUpdatePrivateSongs({ s2 });
		const privateKeys = Object.keys(getState().privateSongs);
		expect(privateKeys).toContain("s1");
		expect(privateKeys).toContain("s2");
	});

	it("adds and merges public songs with addOrUpdatePublicSongs", () => {
		const { slice, getState } = makeTestSlice();

		const p1: SongPublic = makeSongPublic({ song_id: "p1", song_name: "P1", song_slug: "slug-1" });
		const p2: SongPublic = makeSongPublic({ song_id: "p2", song_slug: "slug-2" });

		slice.addOrUpdatePublicSongs({ p1 });
		expect(getState().publicSongs["p1"]).toBeDefined();

		slice.addOrUpdatePublicSongs({ p2 });
		const publicKeys = Object.keys(getState().publicSongs);
		expect(publicKeys).toContain("p1");
		expect(publicKeys).toContain("p2");
	});

	it("getSongBySlug returns both public and private song when available", () => {
		const { slice } = makeTestSlice();

		const songId = "s1";
		const slug = "my-slug";
		const publicSong: SongPublic = makeSongPublic({
			song_id: songId,
			song_name: "Public name",
			song_slug: slug,
		});
		const privateSong = { song_id: songId, created_at: "t", updated_at: "t" };

		slice.addOrUpdatePublicSongs({ [songId]: publicSong });
		slice.addOrUpdatePrivateSongs({ [songId]: privateSong });

		const found = slice.getSongBySlug(slug);
		expect(found).toBeDefined();
		expect(found?.songPublic).toBe(publicSong);
		expect(found?.song).toBe(privateSong);
	});

	it("getSongBySlug returns undefined when slug not found", () => {
		const { slice } = makeTestSlice();
		expect(slice.getSongBySlug("no-such-slug")).toBeUndefined();
	});

	it("removeActivePrivateSongIds calls previous unsubscribe and updates active ids", () => {
		const { slice, setState, getState } = makeTestSlice();

		const spy = vi.fn();
		// Seed state with two active ids and a spy unsubscribe
		setState({ activePrivateSongIds: ["a", "b"], activePrivateSongsUnsubscribe: spy });

		const EXPECTED_CALLS = 1;
		slice.removeActivePrivateSongIds(["a"]);

		expect(spy).toHaveBeenCalledTimes(EXPECTED_CALLS);
		expect(getState().activePrivateSongIds).toStrictEqual(["b"]);
	});

	it("removeActivePublicSongIds calls previous unsubscribe and updates active ids", () => {
		const { slice, setState, getState } = makeTestSlice();

		const spy = vi.fn();
		setState({ activePublicSongIds: ["x", "y"], activePublicSongsUnsubscribe: spy });

		slice.removeActivePublicSongIds(["x"]);

		const EXPECTED_CALLS = 1;
		expect(spy).toHaveBeenCalledTimes(EXPECTED_CALLS);
		expect(getState().activePublicSongIds).toStrictEqual(["y"]);
	});

	it("subscribeToActivePrivateSongs and subscribeToActivePublicSongs return functions", () => {
		const { slice } = makeTestSlice();

		expect(typeof slice.subscribeToActivePrivateSongs).toBe("function");
		const privateUnsubSetup = slice.subscribeToActivePrivateSongs();
		expect(typeof privateUnsubSetup).toBe("function");

		expect(typeof slice.subscribeToActivePublicSongs).toBe("function");
		const publicUnsubSetup = slice.subscribeToActivePublicSongs();
		// The subscribe factory returns a function (the subscription setup) — ensure it's present
		expect(typeof publicUnsubSetup).toBe("function");
	});
});
