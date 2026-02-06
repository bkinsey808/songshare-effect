import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

/**
 * Hook that handles fetching/clearing the current playlist when in edit mode.
 *
 * Note: The project currently fetches playlists by slug; editing routes use a
 * playlist id. There's no `fetchPlaylistById` helper yet, so this hook only
 * performs the cleanup on unmount and contains a TODO to implement fetching by
 * id when an API is available.
 *
 * @returns void
 */
export default function useFetchPlaylist(playlistId?: string): void {
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const clearCurrentPlaylist = useAppStore((state) => state.clearCurrentPlaylist);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);

	useEffect(() => {
		/*
		 If a playlist id is present and does not match the currently-loaded
		 playlist, we would fetch it here.
		*/
		if (
			playlistId !== undefined &&
			playlistId !== "" &&
			currentPlaylist?.playlist_id !== playlistId
		) {
			void Effect.runPromise(fetchPlaylistById(playlistId));
		}
	}, [playlistId, currentPlaylist?.playlist_id, fetchPlaylistById]);

	useEffect(
		() => (): void => {
			clearCurrentPlaylist();
		},
		[clearCurrentPlaylist],
	);
}
