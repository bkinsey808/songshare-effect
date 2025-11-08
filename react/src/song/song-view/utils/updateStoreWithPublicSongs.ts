import type { SongPublic } from "../../song-schema";
import type { SongSubscribeSlice } from "../songSlice";

/**
 * Updates the store with new public songs and manages subscriptions.
 */
export function updateStoreWithPublicSongs({
	publicSongsToAdd,
	state,
	set,
}: {
	publicSongsToAdd: Record<string, SongPublic>;
	state: SongSubscribeSlice & {
		subscribeToActivePublicSongs: () => (() => void) | undefined;
		activePublicSongsUnsubscribe?: () => void;
	};
	set: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((state: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	) => void;
}): {
	newActivePublicSongIds: string[];
	activePublicSongsUnsubscribe: () => void;
} {
	console.warn(
		"[updateStoreWithPublicSongs] Updating store with songs:",
		publicSongsToAdd,
	);

	// Add songs to store
	state.addOrUpdatePublicSongs(publicSongsToAdd);

	// Update activePublicSongIds to include newly fetched songs
	const newActivePublicSongIds = [
		...new Set([
			...state.activePublicSongIds,
			...Object.keys(publicSongsToAdd),
		]),
	];

	// Unsubscribe from previous subscription if exists
	if (typeof state.activePublicSongsUnsubscribe === "function") {
		state.activePublicSongsUnsubscribe();
	}

	// Subscribe to new set
	const activePublicSongsUnsubscribe = state.subscribeToActivePublicSongs();

	// Update store state
	set(() => ({
		activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? (() => {}),
		activePublicSongIds: newActivePublicSongIds,
	}));

	return {
		newActivePublicSongIds,
		activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? (() => {}),
	};
}
