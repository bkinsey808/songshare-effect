import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import { type SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";
import enrichWithOwnerUsername from "@/react/supabase/enrichment/enrichWithOwnerUsername";
import createRealtimeSubscription from "@/react/supabase/subscription/createRealtimeSubscription";
import extractNewRecord from "@/react/supabase/subscription/extractNewRecord";
import extractStringField from "@/react/supabase/subscription/extractStringField";
import isRealtimePayload from "@/react/supabase/subscription/isRealtimePayload";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type SongLibraryEntry } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

/**
 * Type guard to validate that a record has the minimal shape of a SongLibraryEntry.
 * Requires `song_id` and `song_owner_id` fields.
 *
 * @param value - Value to check
 * @returns true if value has string `song_id` and `song_owner_id`
 */
function isSongLibraryEntry(value: unknown): value is SongLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	const { song_id, song_owner_id } = value;
	return isString(song_id) && isString(song_owner_id);
}

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

			// Capture client reference for use in async callbacks
			// SupabaseClient has complex overloaded method signatures that TypeScript cannot verify
			// against SupabaseClientLike without hitting "Type instantiation is excessively deep" errors.
			// At runtime, SupabaseClient implements all required methods.
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const capturedClient = supabaseClient as unknown as SupabaseClientLike;

			// Create subscription using the common utility
			cleanup = createRealtimeSubscription({
				client: capturedClient,
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
								capturedClient,
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
