import React, { type Dispatch, type SetStateAction, useEffect } from "react";

import type { PlaylistEntry } from "@/react/playlist/playlist-types";

import { type PlaylistFormValues } from "../playlistSchema";

export type PopulatePlaylistFormProps = {
	setFormValuesState: Dispatch<SetStateAction<PlaylistFormValues>>;
	setIsLoadingData: Dispatch<SetStateAction<boolean>>;
	hasPopulatedRef: React.RefObject<boolean>;
	isFetchingRef: React.RefObject<boolean>;
};

/**
 * Populate localized form state when a `currentPlaylist` becomes available.
 *
 * This hook centralizes the side-effect of copying playlist data from the
 * store into component-level state.
 */
export default function usePopulatePlaylistForm(
	currentPlaylist: PlaylistEntry | undefined,
	{
		setFormValuesState,
		setIsLoadingData,
		hasPopulatedRef,
		isFetchingRef,
	}: PopulatePlaylistFormProps,
): void {
	useEffect(() => {
		// If we are currently fetching, do not populate yet
		if (isFetchingRef.current) {
			return;
		}

		// If already populated, do not overwrite edits
		if (hasPopulatedRef.current) {
			return;
		}

		if (currentPlaylist?.public) {
			setFormValuesState({
				// Fix: use playlist_id instead of id
				playlist_id: currentPlaylist.playlist_id,
				playlist_name: currentPlaylist.public.playlist_name,
				playlist_slug: currentPlaylist.public.playlist_slug,
				public_notes: currentPlaylist.public.public_notes ?? "",
				private_notes: currentPlaylist.private_notes,
				song_order: currentPlaylist.public.song_order ?? [],
			});

			hasPopulatedRef.current = true;
			setIsLoadingData(false);
		}
	}, [currentPlaylist, setFormValuesState, setIsLoadingData, hasPopulatedRef, isFetchingRef]);
}
