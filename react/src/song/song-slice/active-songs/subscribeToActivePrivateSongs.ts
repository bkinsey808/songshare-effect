// src/features/react/song-subscribe/subscribeToActiveSongs.ts
import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import { type Get } from "@/react/zustand/slice-utils";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

import { type SongSubscribeSlice } from "../song-slice";

export default function subscribeToActivePrivateSongs(
	_set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<SongSubscribeSlice>),
	) => void,
	get: Get<SongSubscribeSlice>,
): () => (() => void) | undefined {
	return (): (() => void) | undefined => {
		// Get authentication token asynchronously
		void (async (): Promise<void> => {
			try {
				const userToken = await getSupabaseAuthToken();

				const client = getSupabaseClient(userToken);

				if (client === undefined) {
					console.warn("[subscribeToActivePrivateSongs] No Supabase client");
					return;
				}

				const { activePrivateSongIds } = get();

				const NO_ACTIVE_IDS = 0;

				if (!Array.isArray(activePrivateSongIds) || activePrivateSongIds.length === NO_ACTIVE_IDS) {
					console.warn("[subscribeToActivePrivateSongs] No activeSongIds, skipping subscription");
					return;
				}

				// Realtime subscription to the `song` table is disabled.
				// The `song` table only contains `private_notes` which doesn't need real-time sync.
				// All song content (name, slug, slides, etc.) is in `song_public` which has its own subscription.
				console.warn(
					"[subscribeToActivePrivateSongs] Realtime subscription disabled - song table only contains private_notes",
				);
			} catch (error: unknown) {
				console.error("[subscribeToActivePrivateSongs] Failed to get auth token:", error);
			}
		})();

		// Return a no-op unsubscribe function since subscription is disabled
		return (): void => {
			// No-op: realtime subscription is disabled for private songs
		};
	};
}
