// Song Library Zustand slice with subscription functionality
// Zustand StateCreator type is not required here — slices are declared as named functions.
import type { Api, Get, Set } from "@/react/zustand/slice-utils";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/zustand/slice-reset-fns";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type {
	AddSongToSongLibraryRequest,
	RemoveSongFromSongLibraryRequest,
	SongLibraryEntry,
	SongLibrarySliceBase,
	SongLibraryState,
} from "./song-library-types";

import addSongToSongLibrary from "./addSongToSongLibrary";
import fetchSongLibraryFn from "./fetchSongLibrary";
import removeSongFromSongLibrary from "./removeSongFromLibrary";
import subscribeToSongLibraryFn from "./subscribeToSongLibrary";

const initialState: SongLibraryState = {
	songLibraryEntries: {} as Record<string, SongLibraryEntry>,
	isSongLibraryLoading: false,
	songLibraryError: undefined as string | undefined,
};

export type SongLibrarySlice = SongLibrarySliceBase & {
	/** Add a song to the user's library */
	addSongToSongLibrary: (request: Readonly<AddSongToSongLibraryRequest>) => Promise<void>;
	/** Remove a song from the user's library */
	removeSongFromSongLibrary: (request: Readonly<RemoveSongFromSongLibraryRequest>) => Promise<void>;
	/** Get all song IDs in the user's library */
	getSongLibrarySongIds: () => string[];
	/** Fetch the user's complete library from the server */
	fetchSongLibrary: () => Promise<void>;

	/** Subscribe to realtime updates for the user's library. Returns an unsubscribe function. */
	subscribeToSongLibrary: () => (() => void) | undefined;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	songLibraryUnsubscribe?: () => void;

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
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		addSongToSongLibrary: async (request: Readonly<AddSongToSongLibraryRequest>) => {
			try {
				await addSongToSongLibrary(request, get);
			} catch (error) {
				const errorMessage = getErrorMessage(error, "Failed to add song to song library");
				const { setSongLibraryError } = get();
				setSongLibraryError(errorMessage);
				console.error("[addSongToSongLibrary] Error:", error);
				throw error;
			}
		},
		removeSongFromSongLibrary: async (request: Readonly<RemoveSongFromSongLibraryRequest>) => {
			try {
				await removeSongFromSongLibrary(request, get);
			} catch (error) {
				const errorMessage = getErrorMessage(error, "Failed to remove song from song library");
				const { setSongLibraryError } = get();
				setSongLibraryError(errorMessage);
				console.error("[removeSongFromSongLibrary] Error:", error);
				throw error;
			}
		},

		isInSongLibrary: (songId: string) => {
			const { songLibraryEntries } = get();
			return songId in songLibraryEntries;
		},

		getSongLibrarySongIds: () => {
			const { songLibraryEntries } = get();
			return Object.keys(songLibraryEntries);
		},

		fetchSongLibrary: async () => {
			try {
				// Delegate the heavy lifting to a separate module to keep the slice small.
				await fetchSongLibraryFn(get);
			} catch (error) {
				const errorMessage = getErrorMessage(error, "Failed to fetch library");
				const { setSongLibraryLoading, setSongLibraryError } = get();
				setSongLibraryLoading(false);
				setSongLibraryError(errorMessage);
				console.error("[fetchSongLibrary] Error:", error);
			}
		},

		subscribeToSongLibrary: () => subscribeToSongLibraryFn(get),

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
