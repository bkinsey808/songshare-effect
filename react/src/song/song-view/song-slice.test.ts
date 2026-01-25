import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api } from "@/react/zustand/slice-utils";

import type { SongPublic } from "../song-schema";

import { createSongSubscribeSlice, type SongSubscribeSlice } from "./song-slice";

function createMockSlice(overrides: Partial<SongSubscribeSlice> = {}): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {},
		activePrivateSongIds: [],
		activePublicSongIds: [],
		addOrUpdatePrivateSongs: () => undefined,
		addOrUpdatePublicSongs: () => undefined,
		addActivePrivateSongIds: () => Effect.sync(() => undefined),
		addActivePublicSongIds: () => Effect.sync(() => undefined),
		addActivePrivateSongSlugs: async () => {
			await Promise.resolve();
			return undefined;
		},
		addActivePublicSongSlugs: async () => {
			await Promise.resolve();
			return undefined;
		},
		removeActivePrivateSongIds: () => undefined,
		removeActivePublicSongIds: () => undefined,
		removeSongsFromCache: () => undefined,
		subscribeToActivePrivateSongs: () => undefined,
		subscribeToActivePublicSongs: () => undefined,
		getSongBySlug: () => undefined,
		...overrides,
	};
}

function makeTestSlice(): {
	slice: SongSubscribeSlice;
	getState: () => SongSubscribeSlice;
	setState: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	) => void;
} {
	let state: SongSubscribeSlice = createMockSlice();

	function set(
		partial:
			| Partial<SongSubscribeSlice>
			| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	): void {
		if (typeof partial === "function") {
			state = {
				...state,
				...(partial as (prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>)(state),
			};
		} else {
			state = { ...state, ...partial };
		}
	}

	function get(): SongSubscribeSlice {
		return state;
	}

	const api: Api<SongSubscribeSlice> = {
		setState: (
			partial:
				| Partial<SongSubscribeSlice>
				| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
		) => {
			set(
				partial as
					| Partial<SongSubscribeSlice>
					| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
			);
		},
		getState: get,
		getInitialState: () => get(),
		subscribe: (_listener: unknown) => (): void => undefined,
	};

	const slice = createSongSubscribeSlice(set, get, api);

	// Ensure state reflects the slice's shape after creation
	state = get();

	return { slice, getState: get, setState: set };
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

		const p1: SongPublic = {
			song_id: "p1",
			song_name: "P1",
			song_slug: "slug-1",
			fields: ["lyrics"],
			slide_order: [],
			slides: {},
			key: "",
			scale: "",
			user_id: "u1",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		};
		const p2: SongPublic = { ...p1, song_id: "p2", song_slug: "slug-2" };

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
		const publicSong: SongPublic = {
			song_id: songId,
			song_name: "Public name",
			song_slug: slug,
			fields: ["lyrics"],
			slide_order: [],
			slides: {},
			key: "",
			scale: "",
			user_id: "u1",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		};
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
