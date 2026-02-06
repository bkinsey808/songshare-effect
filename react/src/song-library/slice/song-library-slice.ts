import type { Effect } from "effect";

// Song Library Zustand slice with subscription functionality
// Zustand StateCreator type is not required here — slices are declared as named functions.
import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type {
	AddSongToSongLibraryRequest,
	RemoveSongFromSongLibraryRequest,
	SongLibraryEntry,
	SongLibrarySliceBase,
	SongLibraryState,
} from "./song-library-types";

import fetchSongLibraryFn from "./fetchSongLibrary";
import addSongToSongLibrary from "./song-add/addSongToSongLibrary";
import removeSongFromSongLibrary from "./song-remove/removeSongFromLibrary";
import subscribeToSongLibraryFn from "./subscribe/subscribeToSongLibrary";
import subscribeToSongPublicFn from "./subscribe/subscribeToSongPublic";

const initialState: SongLibraryState = {
	songLibraryEntries: {} as Record<string, SongLibraryEntry>,
	isSongLibraryLoading: false,
	songLibraryError: undefined as string | undefined,
};

export type SongLibrarySlice = SongLibrarySliceBase & {
	/** Add a song to the user's library */
	addSongToSongLibrary: (
		request: Readonly<AddSongToSongLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Remove a song from the user's library */
	removeSongFromSongLibrary: (
		request: Readonly<RemoveSongFromSongLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Get all song IDs in the user's library */
	getSongLibrarySongIds: () => string[];
	/** Fetch the user's complete library from the server */
	fetchSongLibrary: () => Effect.Effect<void, Error>;

	/** Subscribe to realtime updates for the user's library. Returns an Effect yielding a cleanup function. */
	subscribeToSongLibrary: () => Effect.Effect<() => void, Error>;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	songLibraryUnsubscribe?: () => void;
	/** Internal: holds the current unsubscribe function for song_public subscriptions */
	songLibraryPublicUnsubscribe?: () => void;

	/** Subscribe to realtime updates for the provided song IDs in song_public */
	subscribeToSongPublic: (songIds: readonly string[]) => Effect.Effect<() => void, Error>;

	/** Internal actions for updating state from subscriptions */
	setSongLibraryEntries: (entries: ReadonlyDeep<Record<string, SongLibraryEntry>>) => void;
	setSongLibraryLoading: (loading: boolean) => void;
	setSongLibraryError: (error: string | undefined) => void;
	addSongLibraryEntry: (entry: SongLibraryEntry) => void;
	removeSongLibraryEntry: (songId: string) => void;
};

/**
 * Factory that creates the Song Library Zustand slice.
 *
 * This function returns the slice implementation containing public API methods
 * (add/remove/fetch/subscribe) and internal mutation helpers used by
 * subscriptions and optimistic updates. The factory registers a reset handler
 * which will unsubscribe an active realtime subscription, if present, before
 * restoring the initial state.
 *
 * @param set - Zustand `set` function for updating slice state
 * @param get - Zustand `get` function for reading slice state and helpers
 * @param api - Slice `api` object (unused but kept for consistency with other slices)
 * @returns SongLibrarySlice - The initialized slice with public and internal methods
 */
export function createSongLibrarySlice(
	set: Set<SongLibrarySlice>,
	get: Get<SongLibrarySlice>,
	api: Api<SongLibrarySlice>,
): SongLibrarySlice {
	// silence unused param warnings
	void api;
	sliceResetFns.add(() => {
		// Unsubscribe before resetting state
		const { songLibraryUnsubscribe } = get();
		if (songLibraryUnsubscribe) {
			songLibraryUnsubscribe();
		}
		const { songLibraryPublicUnsubscribe } = get();
		if (songLibraryPublicUnsubscribe) {
			songLibraryPublicUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		addSongToSongLibrary: (request: Readonly<AddSongToSongLibraryRequest>) =>
			addSongToSongLibrary(request, get),
		removeSongFromSongLibrary: (request: Readonly<RemoveSongFromSongLibraryRequest>) =>
			removeSongFromSongLibrary(request, get),

		isInSongLibrary: (songId: string) => {
			const { songLibraryEntries } = get();
			return songId in songLibraryEntries;
		},

		getSongLibrarySongIds: () => {
			const { songLibraryEntries } = get();
			return Object.keys(songLibraryEntries);
		},

		fetchSongLibrary: () => fetchSongLibraryFn(get),

		subscribeToSongLibrary: () => subscribeToSongLibraryFn(get),

		subscribeToSongPublic: (songIds: readonly string[]) => subscribeToSongPublicFn(get, songIds),

		// Internal state management methods
		setSongLibraryEntries: (entries: ReadonlyDeep<Record<string, SongLibraryEntry>>) => {
			set({ songLibraryEntries: entries });
		},

		addSongLibraryEntry: (entry: SongLibraryEntry) => {
			set((state) => ({
				songLibraryEntries: {
					...state.songLibraryEntries,
					[entry.song_id]: entry,
				},
			}));
		},

		removeSongLibraryEntry: (songId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.songLibraryEntries).filter(([id]) => id !== songId),
				);
				return { songLibraryEntries: newEntries };
			});
		},

		setSongLibraryLoading: (loading: boolean) => {
			set({ isSongLibraryLoading: loading });
		},

		setSongLibraryError: (error: string | undefined) => {
			set({ songLibraryError: error });
		},
	};
}
