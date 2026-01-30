import { useEffect } from "react";

import type { PlaylistEntry } from "@/react/playlist/playlist-types";

export type PopulatePlaylistFormSetters = {
	setPlaylistName: (value: string) => void;
	setPlaylistSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;
	setSongOrder: (value: string[]) => void;
};

/**
 * Populate localized form state when a `currentPlaylist` becomes available.
 *
 * This hook centralizes the side-effect of copying playlist data from the
 * store into component-level state. It is kept intentionally small and pure
 * so it can be unit tested in isolation later if desired.
 */
export default function usePopulatePlaylistForm(
	currentPlaylist: PlaylistEntry | undefined,
	setters: PopulatePlaylistFormSetters,
): void {
	useEffect(() => {
		const cp = currentPlaylist;
		if (cp?.public) {
			setters.setPlaylistName(cp.public.playlist_name);
			setters.setPlaylistSlug(cp.public.playlist_slug);
			setters.setPublicNotes(cp.public.public_notes ?? "");
			setters.setPrivateNotes(cp.private_notes);
			setters.setSongOrder([...(cp.public.song_order ?? [])]);
		}
	}, [currentPlaylist, setters]);
}
