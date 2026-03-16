import { Effect } from "effect";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import useAppStore, { getTypedState } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { PlaylistEntry, PlaylistPublic } from "@/react/playlist/playlist-types";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import type { SongPublic } from "@/react/song/song-schema";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

const SONG_ORDER_EMPTY = 0;

export type UsePlaylistViewResult = {
	currentPlaylist: ReadonlyDeep<PlaylistEntry> | undefined;
	playlistPublic: PlaylistPublic | undefined;
	publicSongs: Readonly<Record<string, SongPublic>>;
	isLoading: boolean;
	error: string | undefined;
	isOwner: boolean;
	songOrder: readonly string[];
};

/**
 * Hook that encapsulates playlist view data fetching and side effects.
 *
 * @returns Playlist view state and derived data for the UI
 */
export default function usePlaylistView(): UsePlaylistViewResult {
	const { playlist_slug } = useParams<{ playlist_slug: string }>();

	const currentUserId = useCurrentUserId();
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const isLoading = useAppStore((state) => state.isPlaylistLoading);
	const error = useAppStore((state) => state.playlistError);
	const fetchPlaylist = useAppStore((state) => state.fetchPlaylist);
	const clearCurrentPlaylist = useAppStore((state) => state.clearCurrentPlaylist);
	const addActivePublicSongIds = useAppStore((state) => state.addActivePublicSongIds);

	// Fetch and subscribe to sent shares - must be called before any early return
	useShareSubscription();

	// Fetch playlist on mount or when slug changes.
	useEffect(() => {
		if (playlist_slug !== undefined && playlist_slug !== "") {
			void Effect.runPromise(fetchPlaylist(playlist_slug));
		}

		return (): void => {
			clearCurrentPlaylist();
		};
	}, [playlist_slug, fetchPlaylist, clearCurrentPlaylist]);

	// Auto-add the playlist owner to the user's library (fire-and-forget).
	useEffect(() => {
		const ownerId = currentPlaylist?.user_id;
		if (
			typeof ownerId === "string" &&
			ownerId !== "" &&
			currentUserId !== undefined &&
			currentUserId !== ownerId
		) {
			void (async (): Promise<void> => {
				try {
					await Effect.runPromise(
						addUserToLibraryEffect({ followed_user_id: ownerId }, () => getTypedState()),
					);
				} catch {
					/* ignore errors */
				}
			})();
		}
		// oxlint-disable-next-line no-empty-function -- no cleanup for fire-and-forget; return fn for React 19 HMR
		return;
	}, [currentPlaylist, currentUserId]);

	// Fetch song details so we can display song names (populates publicSongs).
	useEffect(() => {
		const order = currentPlaylist?.public?.song_order;
		if (Array.isArray(order) && order.length > SONG_ORDER_EMPTY) {
			void Effect.runPromise(addActivePublicSongIds(order));
		}
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [currentPlaylist, addActivePublicSongIds]);

	const playlistPublic = currentPlaylist?.public;
	const songOrder = playlistPublic?.song_order ?? [];
	const isOwner = currentUserId !== undefined && currentUserId === currentPlaylist?.user_id;

	return {
		currentPlaylist,
		playlistPublic,
		publicSongs,
		isLoading,
		error,
		isOwner,
		songOrder,
	};
}
