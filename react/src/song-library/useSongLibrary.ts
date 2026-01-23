import { Effect } from "effect";
import { useEffect } from "react";

import { getStoreApi, useAppStoreSelector } from "@/react/zustand/useAppStore";

import type {
	RemoveSongFromSongLibraryRequest,
	SongLibraryEntry,
} from "./slice/song-library-types";

/**
 * Initialize the song library when a page mounts.
 * - Triggers an initial `fetchSongLibrary()` if available
 * - Subscribes to realtime updates via `subscribeToSongLibrary()` and
 *   automatically unsubscribes on unmount
 */
export default function useSongLibrary(): {
	songEntries: SongLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromSongLibrary: (
		request: Readonly<RemoveSongFromSongLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	// Initialize library data on mount
	useEffect((): (() => void) | void => {
		const store = getStoreApi();
		if (!store) {
			return undefined;
		}

		const { fetchSongLibrary, subscribeToSongLibrary } = store.getState();

		void fetchSongLibrary();

		// Subscribe to realtime updates - run the Effect and get cleanup function
		let unsubscribe: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribe = await Effect.runPromise(subscribeToSongLibrary());
			} catch (error) {
				console.error("[useSongLibrary] Failed to subscribe to song library updates:", error);
			}
		})();

		// Cleanup: unsubscribe when component unmounts or auth state changes
		return (): void => {
			if (typeof unsubscribe === "function") {
				unsubscribe();
			}
		};
	}, []);

	// Select state from store (initialization handled by SongLibraryPage)
	const songLibraryEntries = useAppStoreSelector((state) => state.songLibraryEntries);
	const isLoading = useAppStoreSelector((state) => state.isSongLibraryLoading);
	const error = useAppStoreSelector((state) => state.songLibraryError);
	const removeFromSongLibrary = useAppStoreSelector((state) => state.removeSongFromSongLibrary);

	const songEntries = Object.values(songLibraryEntries);

	return {
		songEntries,
		isLoading,
		error,
		removeFromSongLibrary,
	};
}
