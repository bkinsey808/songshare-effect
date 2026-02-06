import type { Get, Set } from "@/react/app-store/app-store-types";

import type { PlaylistSlice } from "../slice/playlist-slice";

/**
 * Factory that creates the `removeSongFromLocalPlaylist` handler for the playlist slice.
 *
 * The returned handler calls the Zustand `set` function with an updater that
 * removes the `songId` from `currentPlaylist.public.song_order` if present.
 * If there is no current playlist or `public` metadata, the updater returns
 * the state unchanged.
 *
 * @returns A function `(songId) => void` that removes the song id from the local playlist
 */
export default function createRemoveSongFromLocalPlaylist(
	set: Set<PlaylistSlice>,
	_get: Get<PlaylistSlice>,
): (songId: string) => void {
	return (songId: string) => {
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
	};
}
