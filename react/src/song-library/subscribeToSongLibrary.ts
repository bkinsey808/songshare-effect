import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import enrichWithOwnerUsername from "@/react/supabase/enrichment/enrichWithOwnerUsername";
import createRealtimeSubscription from "@/react/supabase/subscription/createRealtimeSubscription";
import extractNewRecord from "@/react/supabase/subscription/extractNewRecord";
import extractStringField from "@/react/supabase/subscription/extractStringField";
import isRealtimePayload from "@/react/supabase/subscription/isRealtimePayload";

import type { SongLibrarySlice } from "./song-library-slice";

import isSongLibraryEntry from "./isSongLibraryEntry";

/**
 * Subscribe to realtime updates on the current user's `song_library` table and
 * apply incoming changes to the provided slice getters (`addSongLibraryEntry` / `removeSongLibraryEntry`).
 *
 * The subscription will fetch owner usernames for INSERT/UPDATE events when possible
 * and update the local state optimistically. The function starts an async process
 * to obtain an authenticated Supabase client and returns a synchronous cleanup
 * function that will remove the created channel when invoked.
 *
 * @param get - Zustand slice getter used to access mutation helpers
 * @returns A cleanup function that unsubscribes the realtime channel, or `undefined` if the subscription could not be established
 */
export default function subscribeToSongLibrary(
	get: () => SongLibrarySlice,
): (() => void) | undefined {
	let cleanup: (() => void) | undefined = undefined;

	// Get authentication token asynchronously
	void (async (): Promise<void> => {
		try {
			const userToken = await getSupabaseAuthToken();
			const supabaseClient = getSupabaseClient(userToken);

			if (supabaseClient === undefined) {
				console.warn("[subscribeToSongLibrary] No Supabase client");
				return undefined;
			}

			// Create subscription using the common utility
			cleanup = createRealtimeSubscription({
				client: supabaseClient,
				tableName: "song_library",
				onEvent: async (payload: unknown): Promise<void> => {
					const { addSongLibraryEntry, removeSongLibraryEntry } = get();

					if (!isRealtimePayload(payload)) {
						return;
					}

					const { eventType } = payload;

					switch (eventType) {
						case "INSERT":
						case "UPDATE": {
							const newEntry = extractNewRecord(payload);
							if (newEntry === undefined) {
								break;
							}

							if (!isSongLibraryEntry(newEntry)) {
								// Can't work with malformed payload; skip
								break;
							}

							// Enrich with owner username if available
							const enrichedEntry = await enrichWithOwnerUsername(
								supabaseClient,
								newEntry,
								"song_owner_id",
							);

							addSongLibraryEntry(enrichedEntry);
							break;
						}
						case "DELETE": {
							const oldEntry = payload.old;
							const songId = extractStringField(oldEntry, "song_id");
							if (songId !== undefined) {
								removeSongLibraryEntry(songId);
							}
							break;
						}
					}
				},
			});
		} catch (error) {
			console.error("[subscribeToSongLibrary] Failed to get auth token:", error);
		}
	})();

	// Return a cleanup function that will unsubscribe when called
	return (): void => {
		if (cleanup !== undefined) {
			console.warn("[subscribeToSongLibrary] Cleaning up channel subscription");
			cleanup();
		}
	};
}
