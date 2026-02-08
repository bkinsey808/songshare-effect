import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SongPublic } from "@/react/song/song-schema";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

import updateStoreWithPublicSongs from "./updateStoreWithPublicSongs";

/**
 * Create a minimal {@link SongSubscribeSlice} for tests.
 *
 * This helper returns a shallow slice with the given `activePublicSongIds`
 * and no-op implementations for the methods the slice exposes. Tests
 * replace/spy on specific methods as needed to assert behavior.
 *
 * @param ids - initial active public song ids
 * @returns minimal {@link SongSubscribeSlice}
 */
function makeStateWithActiveIds(ids: readonly string[]): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {},
		activePrivateSongIds: [],
		activePublicSongIds: ids,
		addOrUpdatePrivateSongs: () => undefined,
		addOrUpdatePublicSongs: () => undefined,
		addActivePrivateSongIds: () => Effect.sync(() => undefined),
		addActivePublicSongIds: () => Effect.sync(() => undefined),
		addActivePrivateSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		addActivePublicSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		removeActivePrivateSongIds: () => undefined,
		removeActivePublicSongIds: () => undefined,
		removeSongsFromCache: () => undefined,
		subscribeToActivePrivateSongs: () => undefined,
		subscribeToActivePublicSongs: () => undefined,
		getSongBySlug: () => undefined,
	};
}

describe("updateStoreWithPublicSongs", () => {
	// Verifies that adding public songs merges them into the store, computes a
	// deduplicated list of active public song IDs, tears down the prior
	// realtime subscription, and persists a new unsubscribe function.
	it("adds songs, deduplicates IDs, tears down previous subscription and stores new unsubscribe", () => {
		// Spies/mocks used to observe interactions and simulate unsubscribe handlers
		const addOrUpdatePublicSongs = vi.fn();
		const prevUnsub = vi.fn();
		const newUnsub = vi.fn();

		const state = makeStateWithActiveIds(["songA"]);
		state.addOrUpdatePublicSongs = addOrUpdatePublicSongs;
		// Spy on the subscription factory so tests control the returned
		// unsubscribe function deterministically for assertions below.
		vi.spyOn(state, "subscribeToActivePublicSongs").mockImplementation(() => newUnsub);
		state.activePublicSongsUnsubscribe = prevUnsub;

		// `set` models the Zustand-style updater; we mock it as we assert
		// behavior using the returned values instead of inspecting `set` calls.
		const set = vi.fn();

		const publicSongsToAdd: Record<string, SongPublic> = {
			songB: {
				song_id: "songB",
				song_name: "Song B",
				song_slug: "songB",
				fields: ["lyrics" as const],
				slide_order: [],
				slides: {},
				key: "",
				scale: "",
				user_id: "u1",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
			songA: {
				song_id: "songA",
				song_name: "Song A",
				song_slug: "songA",
				fields: ["lyrics" as const],
				slide_order: [],
				slides: {},
				key: "",
				scale: "",
				user_id: "u1",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
		};

		const result = updateStoreWithPublicSongs({ publicSongsToAdd, state, set });

		// addOrUpdatePublicSongs should be called with the provided songs
		expect(addOrUpdatePublicSongs).toHaveBeenCalledWith(publicSongsToAdd);

		// previous unsubscribe should be invoked
		expect(prevUnsub).toHaveBeenCalledWith();

		// newActivePublicSongIds should reflect the deduplicated union of IDs (computed from mocks)
		const expectedNewIds = [
			...new Set([...state.activePublicSongIds, ...Object.keys(publicSongsToAdd)]),
		];
		expect(result.newActivePublicSongIds).toStrictEqual(expectedNewIds);

		// calling the returned unsubscribe should call the underlying unsubscribe
		result.activePublicSongsUnsubscribe();
		expect(newUnsub).toHaveBeenCalledWith();
	});

	it("handles subscribeToActivePublicSongs returning undefined by storing and returning a no-op", () => {
		const addOrUpdatePublicSongs = vi.fn();
		const state = makeStateWithActiveIds(["songX"]);
		state.addOrUpdatePublicSongs = addOrUpdatePublicSongs;
		// Simulate the subscription API returning `undefined` (no unsubscribe)
		// to assert the function normalizes this into a callable no-op.
		vi.spyOn(state, "subscribeToActivePublicSongs").mockImplementation(() => undefined);

		// `set` is mocked; we derive expectations from the returned object instead
		// of inspecting `set` directly to keep tests focused on outcomes.
		const set = vi.fn();

		const publicSongsToAdd: Record<string, SongPublic> = {
			songY: {
				song_id: "songY",
				song_name: "Song Y",
				song_slug: "songY",
				fields: ["lyrics" as const],
				slide_order: [],
				slides: {},
				key: "",
				scale: "",
				user_id: "u1",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
		};

		const result = updateStoreWithPublicSongs({ publicSongsToAdd, state, set });

		// addOrUpdatePublicSongs should be called
		expect(addOrUpdatePublicSongs).toHaveBeenCalledWith(publicSongsToAdd);

		// newActivePublicSongIds should reflect the deduplicated union of IDs (computed from mocks)
		const expectedNewIds = [
			...new Set([...state.activePublicSongIds, ...Object.keys(publicSongsToAdd)]),
		];
		expect(result.newActivePublicSongIds).toStrictEqual(expectedNewIds);

		// returned unsubscribe should be callable and not throw
		expect(typeof result.activePublicSongsUnsubscribe).toBe("function");
		expect(() => {
			result.activePublicSongsUnsubscribe();
		}).not.toThrow();
	});
});
