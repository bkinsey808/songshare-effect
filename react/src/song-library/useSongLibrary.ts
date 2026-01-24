import { Effect } from "effect";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useAppStore } from "@/react/zustand/useAppStore";

import type {
	RemoveSongFromSongLibraryRequest,
	SongLibraryEntry,
} from "./slice/song-library-types";

/**
 * Initialize the song library when a page mounts.
 * Uses standard Zustand selectors hooks for maximum stability.
 */
export default function useSongLibrary(): {
	songEntries: SongLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromSongLibrary: (
		request: Readonly<RemoveSongFromSongLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	// Standard Zustand selector pattern. Calling useAppStore directly
	// ensures React and the compiler see a standard hook name.
	const songLibraryEntries = useAppStore((state) => state.songLibraryEntries);
	const isLoading = useAppStore((state) => state.isSongLibraryLoading);
	const error = useAppStore((state) => state.songLibraryError);
	const removeFromSongLibrary = useAppStore((state) => state.removeSongFromSongLibrary);
	const fetchSongLibrary = useAppStore((state) => state.fetchSongLibrary);
	const subscribeToSongLibrary = useAppStore((state) => state.subscribeToSongLibrary);
	const subscribeToSongPublic = useAppStore((state) => state.subscribeToSongPublic);

	// Track location to refresh when navigating to the library page
	const location = useLocation();

	// 1. Initial fetch and library subscription
	// Refresh whenever the location changes (user navigates to/back to this page)
	useEffect(() => {
		console.warn("[useSongLibrary] Location changed or mount: triggering fetch and library subscription");

		// Trigger initial fetch
		void Effect.runPromise(fetchSongLibrary());

		// Subscribe to realtime updates for library changes (add/remove)
		let unsubscribe: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribe = await Effect.runPromise(subscribeToSongLibrary());
			} catch (error: unknown) {
				console.error("[useSongLibrary] Failed to subscribe to library:", error);
			}
		})();

		return (): void => {
			if (unsubscribe !== undefined) {
				console.warn("[useSongLibrary] Unsubscribing from library");
				unsubscribe();
			}
		};
	}, [location.pathname, fetchSongLibrary, subscribeToSongLibrary]);

	// 2. Reactive metadata subscription for songs in the library
	// Memoize the sorted keys to ensure the subscription Effect only runs
	// when the actual set of IDs changes.
	const songIdsKey = useMemo(
		() => Object.keys(songLibraryEntries).toSorted().join(","),
		[songLibraryEntries],
	);

	useEffect(() => {
		const songIds = songIdsKey.split(",").filter((id) => id !== "");
		const MIN_IDS = 1;

		if (songIds.length < MIN_IDS) {
			return undefined;
		}

		console.warn(`[useSongLibrary] Subscribing to public updates for ${songIds.length} songs...`);

		let unsubscribe: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribe = await Effect.runPromise(subscribeToSongPublic(songIds));
			} catch (error: unknown) {
				console.error("[useSongLibrary] Failed to subscribe to public updates:", error);
			}
		})();

		return (): void => {
			if (unsubscribe !== undefined) {
				console.warn("[useSongLibrary] Unsubscribing from public metadata updates");
				unsubscribe();
			}
		};
	}, [songIdsKey, subscribeToSongPublic]);

	const songEntries = useMemo(() => Object.values(songLibraryEntries), [songLibraryEntries]);

	return {
		songEntries,
		isLoading,
		error,
		removeFromSongLibrary,
	};
}
