import { type Get } from "@/react/app-store/app-store-types";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { type SongSubscribeSlice } from "../song-slice/song-slice";

/**
 * subscribeToActivePrivateSongs
 *
 * Sets up (but currently does not enable) a realtime subscription for private
 * song records. The asynchronous work (fetching an auth token and creating a
 * Supabase client) is performed inside an async IIFE so this helper can remain
 * synchronous and be safely invoked from a Zustand slice initializer.
 *
 * @param _set - Zustand slice set function for the song subscribe slice
 * @param get - Zustand slice get function to read current state
 * @returns A function that returns a no-op unsubscribe function (or undefined).
 *   Realtime subscriptions for private song data are intentionally disabled
 *   because private notes do not require realtime sync; public song data is
 *   subscribed to via `song_public` elsewhere.
 */
export default function subscribeToActivePrivateSongs(
	_set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<SongSubscribeSlice>),
	) => void,
	get: Get<SongSubscribeSlice>,
): () => (() => void) | undefined {
	return (): (() => void) | undefined => {
		// Perform async work without making the slice initializer async: fetch an
		// auth token and create the Supabase client inside an IIFE.
		void (async (): Promise<void> => {
			try {
				const userToken = await getSupabaseAuthToken();

				const client = getSupabaseClient(userToken);

				if (client === undefined) {
					console.warn("[subscribeToActivePrivateSongs] No Supabase client");
					return;
				}

				const { activePrivateSongIds } = get();

				/** Numeric sentinel used to check for empty activePrivateSongIds arrays */
				const NO_ACTIVE_IDS = 0;

				if (!Array.isArray(activePrivateSongIds) || activePrivateSongIds.length === NO_ACTIVE_IDS) {
					console.warn("[subscribeToActivePrivateSongs] No activeSongIds, skipping subscription");
					return;
				}

				// Realtime subscription to the `song` table is intentionally disabled.
				// The `song` table only contains `private_notes` which do not require realtime sync.
				// Publicly visible song content (name, slug, slides, etc.) lives in `song_public` and
				// is subscribed to separately to keep concerns isolated and avoid unnecessary updates.
				console.warn(
					"[subscribeToActivePrivateSongs] Realtime subscription disabled - song table only contains private_notes",
				);
			} catch (error: unknown) {
				console.error("[subscribeToActivePrivateSongs] Failed to get auth token:", error);
			}
		})();

		// Return a no-op unsubscribe function because realtime subscriptions are disabled
		return (): void => {
			// No-op: realtime subscription is intentionally disabled for private songs
		};
	};
}
