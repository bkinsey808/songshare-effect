import { Effect } from "effect";
import { useEffect } from "react";

/**
 * Loads the signed-in user's song and playlist libraries for community share
 * and management controls.
 *
 * @param userId - current user id, if signed in
 * @param fetchSongLibrary - store action for loading songs
 * @param fetchPlaylistLibrary - store action for loading playlists
 * @returns void
 */
export default function useLoadCommunityLibraries(
	userId: string | undefined,
	fetchSongLibrary: () => Effect.Effect<void, Error>,
	fetchPlaylistLibrary: () => Effect.Effect<void, Error>,
): void {
	// Load the signed-in user's libraries used by community share/manage controls.
	useEffect(() => {
		if (userId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no load when undefined; return fn for React 19 HMR
			return;
		}
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchSongLibrary());
			} catch {
				// Keep community screens usable even if song library fails to load.
			}
			try {
				await Effect.runPromise(fetchPlaylistLibrary());
			} catch {
				// Keep community screens usable even if playlist library fails to load.
			}
		})();
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [fetchPlaylistLibrary, fetchSongLibrary, userId]);
}
