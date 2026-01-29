import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/zustand/slice-utils";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/zustand/slice-reset-fns";

import type {
	PlaylistEntry,
	PlaylistSliceBase,
	PlaylistState,
	SavePlaylistRequest,
} from "./playlist-types";

import fetchPlaylistFn from "./fetchPlaylist";
import savePlaylistFn from "./savePlaylist";

const initialState: PlaylistState = {
	currentPlaylist: undefined,
	isPlaylistLoading: false,
	playlistError: undefined as string | undefined,
	isPlaylistSaving: false,
};

export type PlaylistSlice = PlaylistSliceBase & {
	/** Fetch a playlist by slug */
	fetchPlaylist: (playlistSlug: string) => Effect.Effect<void, Error>;
	/** Save a playlist (create or update) - all changes go through this API call */
	savePlaylist: (request: Readonly<SavePlaylistRequest>) => Effect.Effect<string, Error>;
	/** Clear the current playlist from state */
	clearCurrentPlaylist: () => void;
	/** Update the song order in local state (for optimistic updates before save) */
	updateLocalSongOrder: (songOrder: readonly string[]) => void;
	/** Add a song to local state (for optimistic updates before save) */
	addSongToLocalPlaylist: (songId: string) => void;
	/** Remove a song from local state (for optimistic updates before save) */
	removeSongFromLocalPlaylist: (songId: string) => void;
};

/**
 * Factory that creates the Playlist Zustand slice.
 *
 * This function returns the slice implementation containing public API methods
 * for playlist management. All CRUD operations go through API endpoints.
 * - fetchPlaylist: reads via Supabase client (RLS allows reads)
 * - savePlaylist: calls /api/playlists/save (handles create/update/song changes)
 *
 * @param set - Zustand `set` function for updating slice state
 * @param get - Zustand `get` function for reading slice state and helpers
 * @param api - Slice `api` object (unused but kept for consistency with other slices)
 * @returns PlaylistSlice - The initialized slice with public and internal methods
 */
export function createPlaylistSlice(
	set: Set<PlaylistSlice>,
	get: Get<PlaylistSlice>,
	api: Api<PlaylistSlice>,
): PlaylistSlice {
	// silence unused param warnings
	void api;

	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		fetchPlaylist: (playlistSlug: string) => fetchPlaylistFn(playlistSlug, get),

		savePlaylist: (request: Readonly<SavePlaylistRequest>) => savePlaylistFn(request, get),

		// Internal state management methods
		setCurrentPlaylist: (playlist: PlaylistEntry | undefined) => {
			set({ currentPlaylist: playlist as ReadonlyDeep<PlaylistEntry> | undefined });
		},

		setPlaylistLoading: (loading: boolean) => {
			set({ isPlaylistLoading: loading });
		},

		setPlaylistError: (error: string | undefined) => {
			set({ playlistError: error });
		},

		setPlaylistSaving: (saving: boolean) => {
			set({ isPlaylistSaving: saving });
		},

		isSongInPlaylist: (songId: string) => {
			const { currentPlaylist } = get();
			if (!currentPlaylist?.public?.song_order) {
				return false;
			}
			return currentPlaylist.public.song_order.includes(songId);
		},

		clearCurrentPlaylist: () => {
			set({ currentPlaylist: undefined, playlistError: undefined });
		},

		/**
		 * Update the song order in local state. Use for optimistic updates before calling savePlaylist.
		 */
		updateLocalSongOrder: (songOrder: readonly string[]) => {
			set((state) => {
				if (!state.currentPlaylist?.public) {
					return state;
				}
				return {
					currentPlaylist: {
						...state.currentPlaylist,
						public: {
							...state.currentPlaylist.public,
							song_order: [...songOrder],
						},
					},
				};
			});
		},

		/**
		 * Add a song to the local playlist state. Use for optimistic updates before calling savePlaylist.
		 */
		addSongToLocalPlaylist: (songId: string) => {
			set((state) => {
				if (!state.currentPlaylist?.public) {
					return state;
				}
				const currentOrder = state.currentPlaylist.public.song_order;
				if (currentOrder.includes(songId)) {
					return state; // Already in playlist
				}
				return {
					currentPlaylist: {
						...state.currentPlaylist,
						public: {
							...state.currentPlaylist.public,
							song_order: [...currentOrder, songId],
						},
					},
				};
			});
		},

		/**
		 * Remove a song from the local playlist state. Use for optimistic updates before calling savePlaylist.
		 */
		removeSongFromLocalPlaylist: (songId: string) => {
			set((state) => {
				if (!state.currentPlaylist?.public) {
					return state;
				}
				return {
					currentPlaylist: {
						...state.currentPlaylist,
						public: {
							...state.currentPlaylist.public,
							song_order: state.currentPlaylist.public.song_order.filter((id) => id !== songId),
						},
					},
				};
			});
		},
	};
}
