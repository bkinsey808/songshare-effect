import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/zustand/slice-utils";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/zustand/slice-reset-fns";

import type {
	AddPlaylistToLibraryRequest,
	PlaylistLibraryEntry,
	PlaylistLibrarySliceBase,
	PlaylistLibraryState,
	RemovePlaylistFromLibraryRequest,
} from "./playlist-library-types";

import addPlaylistToLibraryFn from "./addPlaylistToLibrary";
import fetchPlaylistLibraryFn from "./fetchPlaylistLibrary";
import removePlaylistFromLibraryFn from "./removePlaylistFromLibrary";
import subscribeToPlaylistLibraryFn from "./subscribe/subscribeToPlaylistLibrary";
import subscribeToPlaylistPublicFn from "./subscribe/subscribeToPlaylistPublic";

const initialState: PlaylistLibraryState = {
	playlistLibraryEntries: {} as Record<string, PlaylistLibraryEntry>,
	isPlaylistLibraryLoading: false,
	playlistLibraryError: undefined as string | undefined,
};

export type PlaylistLibrarySlice = PlaylistLibrarySliceBase & {
	/** Add a playlist to the user's library (via API - also adds all songs to song library) */
	addPlaylistToLibrary: (
		request: Readonly<AddPlaylistToLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Remove a playlist from the user's library (via API) */
	removePlaylistFromLibrary: (
		request: Readonly<RemovePlaylistFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Get all playlist IDs in the user's library */
	getPlaylistLibraryIds: () => string[];
	/** Fetch the user's complete playlist library from the server */
	fetchPlaylistLibrary: () => Effect.Effect<void, Error>;

	/** Subscribe to realtime updates for the user's library. Returns an Effect yielding a cleanup function. */
	subscribeToPlaylistLibrary: () => Effect.Effect<() => void, Error>;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	playlistLibraryUnsubscribe?: () => void;
	/** Internal: holds the current unsubscribe function for playlist_public subscriptions */
	playlistLibraryPublicUnsubscribe?: () => void;

	/** Subscribe to realtime updates for the provided playlist IDs in playlist_public */
	subscribeToPlaylistPublic: (playlistIds: readonly string[]) => Effect.Effect<() => void, Error>;

	/** Internal actions for updating state from subscriptions */
	setPlaylistLibraryEntries: (entries: ReadonlyDeep<Record<string, PlaylistLibraryEntry>>) => void;
	setPlaylistLibraryLoading: (loading: boolean) => void;
};

/**
 * Factory that creates the Playlist Library Zustand slice.
 *
 * This function returns the slice implementation containing public API methods
 * (add/remove/fetch/subscribe) and internal mutation helpers used by
 * subscriptions and optimistic updates. The factory registers a reset handler
 * which will unsubscribe active realtime subscriptions, if present, before
 * restoring the initial state.
 *
 * @param set - Zustand `set` function for updating slice state
 * @param get - Zustand `get` function for reading slice state and helpers
 * @param api - Slice `api` object (unused but kept for consistency with other slices)
 * @returns PlaylistLibrarySlice - The initialized slice with public and internal methods
 */
export function createPlaylistLibrarySlice(
	set: Set<PlaylistLibrarySlice>,
	get: Get<PlaylistLibrarySlice>,
	api: Api<PlaylistLibrarySlice>,
): PlaylistLibrarySlice {
	// silence unused param warnings
	void api;
	sliceResetFns.add(() => {
		// Unsubscribe before resetting state
		const { playlistLibraryUnsubscribe } = get();
		if (playlistLibraryUnsubscribe) {
			playlistLibraryUnsubscribe();
		}
		const { playlistLibraryPublicUnsubscribe } = get();
		if (playlistLibraryPublicUnsubscribe) {
			playlistLibraryPublicUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		addPlaylistToLibrary: (request: Readonly<AddPlaylistToLibraryRequest>) =>
			addPlaylistToLibraryFn(request, get),
		removePlaylistFromLibrary: (request: Readonly<RemovePlaylistFromLibraryRequest>) =>
			removePlaylistFromLibraryFn(request, get),

		isInPlaylistLibrary: (playlistId: string) => {
			const { playlistLibraryEntries } = get();
			return playlistId in playlistLibraryEntries;
		},

		getPlaylistLibraryIds: () => {
			const { playlistLibraryEntries } = get();
			return Object.keys(playlistLibraryEntries);
		},

		fetchPlaylistLibrary: () => fetchPlaylistLibraryFn(get),

		subscribeToPlaylistLibrary: () => subscribeToPlaylistLibraryFn(get),

		subscribeToPlaylistPublic: (playlistIds: readonly string[]) =>
			subscribeToPlaylistPublicFn(get, playlistIds),

		// Internal state management methods
		setPlaylistLibraryEntries: (entries: ReadonlyDeep<Record<string, PlaylistLibraryEntry>>) => {
			set({ playlistLibraryEntries: entries });
		},

		addPlaylistLibraryEntry: (entry: PlaylistLibraryEntry) => {
			set((state) => ({
				playlistLibraryEntries: {
					...state.playlistLibraryEntries,
					[entry.playlist_id]: entry,
				},
			}));
		},

		removePlaylistLibraryEntry: (playlistId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.playlistLibraryEntries).filter(([id]) => id !== playlistId),
				);
				return { playlistLibraryEntries: newEntries };
			});
		},

		setPlaylistLibraryLoading: (loading: boolean) => {
			set({ isPlaylistLibraryLoading: loading });
		},

		setPlaylistLibraryError: (error: string | undefined) => {
			set({ playlistLibraryError: error });
		},
	};
}
