import { Effect as EffectRuntime } from "effect";
import { useEffect, useRef } from "react";

import useAppStore from "@/react/app-store/useAppStore";

const PUBLIC_SUB_INITIAL_RUN = 0;

/**
 * Hook to manage playlist library data: fetching, subscribing to updates,
 * and maintaining public metadata for all library entries.
 */
export default function usePlaylistLibraryManagement(): void {
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const subscribeToPlaylistLibrary = useAppStore((state) => state.subscribeToPlaylistLibrary);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const subscribeToPlaylistPublic = useAppStore((state) => state.subscribeToPlaylistPublic);

	// Load playlist library once and subscribe to updates
	useEffect(() => {
		let unsubscribe: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchPlaylistLibrary());
			} catch {
				// Keep manager usable even if playlist library fails to load.
			}

			try {
				unsubscribe = await EffectRuntime.runPromise(subscribeToPlaylistLibrary());
			} catch (error: unknown) {
				console.error(
					"[usePlaylistLibraryManagement] playlist library subscription failed:",
					error,
				);
			}
		})();

		return (): void => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [fetchPlaylistLibrary, subscribeToPlaylistLibrary]);

	// Maintain public metadata for all playlists in the library
	const playlistIdsKey = Object.keys(playlistLibraryEntries).toSorted().join(",");
	const publicUnsubRef = useRef<(() => void) | undefined>(undefined);
	const publicRunRef = useRef(PUBLIC_SUB_INITIAL_RUN);

	// Subscribe to public metadata for all playlists in the library
	useEffect(() => {
		const playlistIds = playlistIdsKey.split(",").filter((id) => id !== "");
		const MIN_IDS = 1;

		if (playlistIds.length < MIN_IDS) {
			publicUnsubRef.current = undefined;
			return undefined;
		}

		const run = (publicRunRef.current += 1);
		void (async (): Promise<void> => {
			let unsubscribe: (() => void) | undefined = undefined;
			try {
				unsubscribe = await EffectRuntime.runPromise(subscribeToPlaylistPublic(playlistIds));
			} catch (error: unknown) {
				console.error("[usePlaylistLibraryManagement] playlist public subscription failed:", error);
			}

			if (unsubscribe) {
				if (run === publicRunRef.current) {
					publicUnsubRef.current = unsubscribe;
				} else {
					unsubscribe();
				}
			}
		})();

		return (): void => {
			const fn = publicUnsubRef.current;
			publicUnsubRef.current = undefined;
			if (fn !== undefined) {
				fn();
			}
		};
	}, [playlistIdsKey, subscribeToPlaylistPublic]);
}
