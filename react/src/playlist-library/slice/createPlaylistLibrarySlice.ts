import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import addPlaylistToLibraryFn from "../playlist-add/addPlaylistToLibrary";
import removePlaylistFromLibraryFn from "../playlist-remove/removePlaylistFromLibrary";
import fetchPlaylistLibraryFn from "./fetchPlaylistLibrary";
import type {
	AddPlaylistToLibraryRequest,
	PlaylistLibraryEntry,
	PlaylistLibraryState,
	RemovePlaylistFromLibraryRequest,
} from "./playlist-library-types";
import type { PlaylistLibrarySlice } from "./PlaylistLibrarySlice.type";
import subscribeToPlaylistLibraryFn from "./subscribe/subscribeToPlaylistLibrary";
import subscribeToPlaylistPublicFn from "./subscribe/subscribeToPlaylistPublic";

const initialState: PlaylistLibraryState = {
	playlistLibraryEntries: {} as Record<string, PlaylistLibraryEntry>,
	isPlaylistLibraryLoading: false,
	playlistLibraryError: undefined as string | undefined,
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
export default function createPlaylistLibrarySlice(
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
