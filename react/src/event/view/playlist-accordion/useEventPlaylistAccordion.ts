import useAppStore from "@/react/app-store/useAppStore";

/**
 * Hook for managing the state of the event playlist accordion.
 * Handles loading state, playlist name, and song order.
 *
 * @param playlistId - The ID of the playlist to display.
 * @returns Object containing playlist data and loading state.
 */
export default function useEventPlaylistAccordion(playlistId: string): {
	isLoading: boolean;
	playlistName: string;
	songOrder: readonly string[];
	publicSongs: Record<string, { song_name?: string; user_id?: string; [key: string]: unknown }>;
} {
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const publicSongs = useAppStore((state) => state.publicSongs);

	const isLoading =
		currentPlaylist === undefined ||
		currentPlaylist.playlist_id !== playlistId ||
		!Array.isArray(currentPlaylist.public?.song_order);

	const playlistName = currentPlaylist?.public?.playlist_name ?? "Untitled Playlist";
	const songOrder = currentPlaylist?.public?.song_order ?? [];

	return {
		isLoading,
		playlistName,
		songOrder,
		publicSongs,
	};
}
