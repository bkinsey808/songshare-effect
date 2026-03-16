import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import addPlaylistToLibraryFn from "../playlist-add/addPlaylistToLibrary";
import removePlaylistFromLibraryFn from "../playlist-remove/removePlaylistFromLibrary";
import createPlaylistLibrarySlice from "./createPlaylistLibrarySlice";
import fetchPlaylistLibraryFn from "./fetchPlaylistLibrary";
import type { PlaylistLibrarySlice } from "./PlaylistLibrarySlice.type";
import subscribeToPlaylistLibraryFn from "./subscribe/subscribeToPlaylistLibrary";
import subscribeToPlaylistPublicFn from "./subscribe/subscribeToPlaylistPublic";

vi.mock("../playlist-add/addPlaylistToLibrary");
vi.mock("../playlist-remove/removePlaylistFromLibrary");
vi.mock("./fetchPlaylistLibrary");
vi.mock("./subscribe/subscribeToPlaylistLibrary");
vi.mock("./subscribe/subscribeToPlaylistPublic");

/**
 * Returns a minimal mock store with vi.fn() stubs for set/get and a minimal api.
 * Get returns empty playlist library state so methods like getPlaylistLibraryIds work.
 */
function makeMockStore(): {
	set: Set<PlaylistLibrarySlice>;
	get: Get<PlaylistLibrarySlice>;
	api: Api<PlaylistLibrarySlice>;
} {
	const set = vi.fn();
	const get = forceCast<Get<PlaylistLibrarySlice>>(
		vi.fn(() => ({
			playlistLibraryEntries: {},
			isPlaylistLibraryLoading: false,
			playlistLibraryError: undefined,
			playlistLibraryUnsubscribe: undefined,
			playlistLibraryPublicUnsubscribe: undefined,
		})),
	);
	const api: Api<PlaylistLibrarySlice> = {
		setState: set as Set<PlaylistLibrarySlice>,
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};
	return { set: set as Set<PlaylistLibrarySlice>, get, api };
}

describe("createPlaylistLibrarySlice", () => {
	it("returns initial state", () => {
		vi.mocked(addPlaylistToLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(removePlaylistFromLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(fetchPlaylistLibraryFn).mockReturnValue(Effect.succeed(undefined));
		vi.mocked(subscribeToPlaylistLibraryFn).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToPlaylistPublicFn).mockReturnValue(Effect.succeed(() => undefined));

		const { set, get, api } = makeMockStore();
		const slice = createPlaylistLibrarySlice(set, get, api);

		expect(slice.playlistLibraryEntries).toStrictEqual({});
		expect(slice.isPlaylistLibraryLoading).toBe(false);
		expect(slice.playlistLibraryError).toBeUndefined();
	});

	it("getPlaylistLibraryIds returns empty array when library is empty", () => {
		vi.mocked(addPlaylistToLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(removePlaylistFromLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(fetchPlaylistLibraryFn).mockReturnValue(Effect.succeed(undefined));
		vi.mocked(subscribeToPlaylistLibraryFn).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToPlaylistPublicFn).mockReturnValue(Effect.succeed(() => undefined));

		const { set, get, api } = makeMockStore();
		const slice = createPlaylistLibrarySlice(set, get, api);
		const ids = slice.getPlaylistLibraryIds();

		expect(ids).toStrictEqual([]);
	});

	it("isInPlaylistLibrary returns false when library is empty", () => {
		vi.mocked(addPlaylistToLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(removePlaylistFromLibraryFn).mockImplementation(() => Effect.succeed(undefined));
		vi.mocked(fetchPlaylistLibraryFn).mockReturnValue(Effect.succeed(undefined));
		vi.mocked(subscribeToPlaylistLibraryFn).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToPlaylistPublicFn).mockReturnValue(Effect.succeed(() => undefined));

		const { set, get, api } = makeMockStore();
		const slice = createPlaylistLibrarySlice(set, get, api);

		expect(slice.isInPlaylistLibrary("playlist-1")).toBe(false);
	});
});
