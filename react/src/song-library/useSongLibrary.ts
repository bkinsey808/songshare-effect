import { Effect } from "effect";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { useAppStore } from "@/react/zustand/useAppStore";

import type {
	RemoveSongFromSongLibraryRequest,
	SongLibraryEntry,
} from "./slice/song-library-types";

const PUBLIC_SUB_INITIAL_RUN = 0;

/**
 * Initialize the song library when a page mounts.
 * Uses standard Zustand selectors hooks for maximum stability.
 *
 * @returns Object exposing library entries, loading state, error and remove handler
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
		console.warn(
			"[useSongLibrary] Location changed or mount: triggering fetch and library subscription",
		);

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
	// React Compiler automatically memoizes this value
	const songIdsKey = Object.keys(songLibraryEntries).toSorted().join(",");
	const publicUnsubRef = useRef<(() => void) | undefined>(undefined);
	const publicRunRef = useRef(PUBLIC_SUB_INITIAL_RUN);

	useEffect(() => {
		const songIds = songIdsKey.split(",").filter((id) => id !== "");
		const MIN_IDS = 1;

		if (songIds.length < MIN_IDS) {
			// Clear ref so a previous subscription is still cleaned up on unmount
			publicUnsubRef.current = undefined;
			return undefined;
		}

		const run = (publicRunRef.current += 1);
		console.warn(`[useSongLibrary] Subscribing to public updates for ${songIds.length} songs...`);

		void (async (): Promise<void> => {
			try {
				const unsubscribe = await Effect.runPromise(subscribeToSongPublic(songIds));
				// Only assign if this effect run is still current (no re-run or unmount yet)
				if (run === publicRunRef.current) {
					publicUnsubRef.current = unsubscribe;
				} else {
					unsubscribe();
				}
			} catch (error: unknown) {
				console.error("[useSongLibrary] Failed to subscribe to public updates:", error);
			}
		})();

		return (): void => {
			const fn = publicUnsubRef.current;
			publicUnsubRef.current = undefined;
			if (fn !== undefined) {
				console.warn("[useSongLibrary] Unsubscribing from public metadata updates");
				fn();
			}
		};
	}, [songIdsKey, subscribeToSongPublic]);

	// React Compiler automatically memoizes this value
	const songEntries = Object.values(songLibraryEntries);

	return {
		songEntries,
		isLoading,
		error,
		removeFromSongLibrary,
	};
}
