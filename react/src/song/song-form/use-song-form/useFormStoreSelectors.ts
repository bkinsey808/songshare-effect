import type { Effect } from "effect";

import useAppStore from "@/react/app-store/useAppStore";
import { type SongPublic } from "@/react/song/song-schema";

type UseFormStoreSelectorReturn = {
	readonly addActivePrivateSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly addOrUpdatePublicSongs: (songs: Readonly<Record<string, SongPublic>>) => void;
	readonly removeActivePrivateSongIds: (songIds: readonly string[]) => void;
	readonly removeActivePublicSongIds: (songIds: readonly string[]) => void;
	readonly removeSongsFromCache: (songIds: readonly string[]) => void;
	readonly removeSongLibraryEntry: (songId: string) => void;
	readonly addSongLibraryEntry: (entry: {
		song_id: string;
		user_id: string;
		song_owner_id: string;
		created_at: string;
		song_name: string;
		song_slug: string;
	}) => void;
	readonly privateSongs: Record<string, unknown>;
	readonly publicSongs: Record<string, unknown>;
	readonly currentUserId: string | undefined;
};

/**
 * Extract and provide all store selectors needed for song form operations.
 *
 * @returns Object containing all app store selectors and methods
 */
export default function useFormStoreSelectors(): UseFormStoreSelectorReturn {
	const addActivePrivateSongIds = useAppStore((state) => state.addActivePrivateSongIds);
	const addActivePublicSongIds = useAppStore((state) => state.addActivePublicSongIds);
	const addOrUpdatePublicSongs = useAppStore((state) => state.addOrUpdatePublicSongs);
	const removeActivePrivateSongIds = useAppStore((state) => state.removeActivePrivateSongIds);
	const removeActivePublicSongIds = useAppStore((state) => state.removeActivePublicSongIds);
	const removeSongsFromCache = useAppStore((state) => state.removeSongsFromCache);
	const removeSongLibraryEntry = useAppStore((state) => state.removeSongLibraryEntry);
	const addSongLibraryEntry = useAppStore((state) => state.addSongLibraryEntry);
	const privateSongs = useAppStore((state) => state.privateSongs);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	return {
		addActivePrivateSongIds,
		addActivePublicSongIds,
		addOrUpdatePublicSongs,
		removeActivePrivateSongIds,
		removeActivePublicSongIds,
		removeSongsFromCache,
		removeSongLibraryEntry,
		addSongLibraryEntry,
		privateSongs,
		publicSongs,
		currentUserId,
	};
}
