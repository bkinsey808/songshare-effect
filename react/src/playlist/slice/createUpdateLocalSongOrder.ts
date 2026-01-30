import type { Get, Set } from "@/react/zustand/slice-utils";

import type { PlaylistSlice } from "./playlist-slice";

/**
 * Factory that creates the `updateLocalSongOrder` handler for the playlist slice.
 *
 * The returned handler updates the `currentPlaylist.public.song_order` array in
 * Zustand local state for optimistic updates before saving. If there's no
 * current playlist or `public` metadata, the handler leaves state unchanged.
 *
 * @param set - Zustand `set` function used to apply the state update
 * @param _get - Zustand `get` function (unused but accepted for parity)
 * @returns A function that accepts a `songOrder` array and updates local state
 */
export default function createUpdateLocalSongOrder(
	set: Set<PlaylistSlice>,
	_get: Get<PlaylistSlice>,
): (songOrder: readonly string[]) => void {
	return (songOrder: readonly string[]) => {
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
	};
}
