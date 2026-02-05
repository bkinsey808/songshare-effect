import type { Get, Set } from "@/react/zustand/slice-utils";

import type { PlaylistSlice } from "../slice/playlist-slice";

/**
 * Factory that creates the `addSongToLocalPlaylist` handler for the playlist slice.
 *
 * The returned handler calls the Zustand `set` function with an updater that
 * adds the `songId` to `currentPlaylist.public.song_order` if present and not
 * already included. If there is no current playlist or `public` metadata, the
 * updater returns the state unchanged.
 *
 * @returns A function `(songId) => void` that appends the song to the local playlist
 */
export default function createAddSongToLocalPlaylist(
	set: Set<PlaylistSlice>,
	_get: Get<PlaylistSlice>,
): (songId: string) => void {
	return (songId: string) => {
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
	};
}
