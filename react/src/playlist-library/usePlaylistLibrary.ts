import { Effect } from "effect";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";

import type {
	PlaylistLibraryEntry,
	RemovePlaylistFromLibraryRequest,
} from "./slice/playlist-library-types";

const PUBLIC_SUB_INITIAL_RUN = 0;

/**
 * Initialize the playlist library when a page mounts.
 * Uses standard Zustand selectors hooks for maximum stability.
 * @returns Playlist library state and actions.
 */
export default function usePlaylistLibrary(): {
	playlistEntries: PlaylistLibraryEntry[];
	isLoading: boolean;
	error: string | undefined;
	removeFromPlaylistLibrary: (
		request: Readonly<RemovePlaylistFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
} {
	// Standard Zustand selector pattern
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const isLoading = useAppStore((state) => state.isPlaylistLibraryLoading);
	const error = useAppStore((state) => state.playlistLibraryError);
	const removeFromPlaylistLibrary = useAppStore((state) => state.removePlaylistFromLibrary);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const subscribeToPlaylistLibrary = useAppStore((state) => state.subscribeToPlaylistLibrary);
	const subscribeToPlaylistPublic = useAppStore((state) => state.subscribeToPlaylistPublic);

	// Track location to refresh when navigating to the library page
	const location = useLocation();

	// 1. Initial fetch and library subscription
	useEffect(() => {
		console.warn(
			"[usePlaylistLibrary] Location changed or mount: triggering fetch and library subscription",
		);

		// Trigger initial fetch
		void Effect.runPromise(fetchPlaylistLibrary());

		// Subscribe to realtime updates for library changes (add/remove)
		let unsubscribe: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				unsubscribe = await Effect.runPromise(subscribeToPlaylistLibrary());
			} catch (error: unknown) {
				console.error("[usePlaylistLibrary] Failed to subscribe to library:", error);
			}
		})();

		return (): void => {
			if (unsubscribe !== undefined) {
				console.warn("[usePlaylistLibrary] Unsubscribing from library");
				unsubscribe();
			}
		};
	}, [location.pathname, fetchPlaylistLibrary, subscribeToPlaylistLibrary]);

	// 2. Reactive metadata subscription for playlists in the library
	const playlistIdsKey = Object.keys(playlistLibraryEntries).toSorted().join(",");
	const publicUnsubRef = useRef<(() => void) | undefined>(undefined);
	const publicRunRef = useRef(PUBLIC_SUB_INITIAL_RUN);

	useEffect(() => {
		const playlistIds = playlistIdsKey.split(",").filter((id) => id !== "");
		const MIN_IDS = 1;

		if (playlistIds.length < MIN_IDS) {
			publicUnsubRef.current = undefined;
			return undefined;
		}

		const run = (publicRunRef.current += 1);
		console.warn(
			`[usePlaylistLibrary] Subscribing to public updates for ${playlistIds.length} playlists...`,
		);

		void (async (): Promise<void> => {
			try {
				const unsubscribe = await Effect.runPromise(subscribeToPlaylistPublic(playlistIds));
				if (run === publicRunRef.current) {
					publicUnsubRef.current = unsubscribe;
				} else {
					unsubscribe();
				}
			} catch (error: unknown) {
				console.error("[usePlaylistLibrary] Failed to subscribe to public updates:", error);
			}
		})();

		return (): void => {
			const fn = publicUnsubRef.current;
			publicUnsubRef.current = undefined;
			if (fn !== undefined) {
				console.warn("[usePlaylistLibrary] Unsubscribing from public metadata updates");
				fn();
			}
		};
	}, [playlistIdsKey, subscribeToPlaylistPublic]);

	const playlistEntries = Object.values(playlistLibraryEntries);

	return {
		playlistEntries,
		isLoading,
		error,
		removeFromPlaylistLibrary,
	};
}
