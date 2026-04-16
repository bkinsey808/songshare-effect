import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import { createSongLibrarySlice, type SongLibrarySlice } from "./song-library-slice";

/**
 * Returns a minimal mock store with vi.fn() stubs for set/get and a minimal api.
 * Get returns empty song library state so methods like getSongLibrarySongIds work.
 *
 * @returns mock store utilities (`set`, `get`, `api`)
 */
function makeMockStore(): {
	set: Set<SongLibrarySlice>;
	get: Get<SongLibrarySlice>;
	api: Api<SongLibrarySlice>;
} {
	const set = vi.fn();
	const get = forceCast<Get<SongLibrarySlice>>(
		vi.fn(() => ({
			songLibraryEntries: {},
			isSongLibraryLoading: false,
			songLibraryError: undefined,
		})),
	);
	const api: Api<SongLibrarySlice> = {
		setState: set as Set<SongLibrarySlice>,
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};
	return { set: set as Set<SongLibrarySlice>, get, api };
}

describe("createSongLibrarySlice", () => {
	it("returns initial state", () => {
		const { set, get, api } = makeMockStore();

		const slice = createSongLibrarySlice(set, get, api);

		expect(slice.songLibraryEntries).toStrictEqual({});
		expect(slice.isSongLibraryLoading).toBe(false);
		expect(slice.songLibraryError).toBeUndefined();
	});

	it("getSongLibrarySongIds returns empty array when library is empty", () => {
		const { set, get, api } = makeMockStore();

		const slice = createSongLibrarySlice(set, get, api);
		const ids = slice.getSongLibrarySongIds();

		expect(ids).toStrictEqual([]);
	});
});
