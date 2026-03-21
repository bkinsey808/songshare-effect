import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { EventLibraryEntry } from "@/react/event-library/event-library-types";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";
import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";
import fetchEventsByTagRequest from "@/react/tag-library/event/fetchEventsByTagRequest";
import fetchImagesByTagRequest from "@/react/tag-library/image/fetchImagesByTagRequest";
import fetchPlaylistsByTagRequest from "@/react/tag-library/playlist/fetchPlaylistsByTagRequest";
import fetchSongsByTagRequest from "@/react/tag-library/song/fetchSongsByTagRequest";

export type UseTagViewReturn = {
	currentUserId: string | undefined;
	imageEntries: ImageLibraryEntry[];
	songEntries: SongLibraryEntry[];
	playlistEntries: PlaylistLibraryEntry[];
	eventEntries: EventLibraryEntry[];
	error: string | undefined;
	isLoading: boolean;
	tag_slug: string | undefined;
};

/**
 * Loads items for the tag slug from the current route across all library types
 * (images, songs, playlists, events), filtered to the current user's libraries.
 *
 * @returns currentUserId - ID of the currently signed-in user, if any
 * @returns imageEntries - array of `ImageLibraryEntry` objects for the tag
 * @returns songEntries - array of `SongLibraryEntry` objects for the tag
 * @returns playlistEntries - array of `PlaylistLibraryEntry` objects for the tag
 * @returns eventEntries - array of `EventLibraryEntry` objects for the tag
 * @returns error - error message when loading fails, or `undefined`
 * @returns isLoading - `true` while a fetch is in progress
 * @returns tag_slug - the tag slug read from route params, or `undefined`
 */
export default function useTagView(): UseTagViewReturn {
	const { tag_slug } = useParams<{ tag_slug: string }>();
	const currentUserId = useCurrentUserId();
	const [imageEntries, setImageEntries] = useState<ImageLibraryEntry[]>([]);
	const [songEntries, setSongEntries] = useState<SongLibraryEntry[]>([]);
	const [playlistEntries, setPlaylistEntries] = useState<PlaylistLibraryEntry[]>([]);
	const [eventEntries, setEventEntries] = useState<EventLibraryEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	// Fetch all item entries for the current tag slug whenever it changes
	useEffect(() => {
		if (tag_slug === undefined) {
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setError(undefined);
		void (async (): Promise<void> => {
			const [imagesResult, songsResult, playlistsResult, eventsResult] = await Promise.all([
				fetchImagesByTagRequest(tag_slug),
				fetchSongsByTagRequest(tag_slug),
				fetchPlaylistsByTagRequest(tag_slug),
				fetchEventsByTagRequest(tag_slug),
			]);

			const firstError = [imagesResult, songsResult, playlistsResult, eventsResult].find(
				(result) => !result.ok,
			);
			if (firstError !== undefined && !firstError.ok) {
				setError(firstError.error);
			} else {
				if (imagesResult.ok) { setImageEntries(imagesResult.entries); }
				if (songsResult.ok) { setSongEntries(songsResult.entries); }
				if (playlistsResult.ok) { setPlaylistEntries(playlistsResult.entries); }
				if (eventsResult.ok) { setEventEntries(eventsResult.entries); }
			}
			setIsLoading(false);
		})();
	}, [tag_slug]);

	return {
		currentUserId,
		imageEntries,
		songEntries,
		playlistEntries,
		eventEntries,
		error,
		isLoading,
		tag_slug,
	};
}
