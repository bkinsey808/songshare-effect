import {
	REALTIME_SUBSCRIBE_STATES,
	type RealtimeChannel,
	type SupabaseClient,
} from "@supabase/supabase-js";

import { getSupabaseAuthToken } from "@/react/supabase/getSupabaseAuthToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type SongLibraryEntry } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

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
	let channel: RealtimeChannel | undefined = undefined;
	let client: SupabaseClient | undefined = undefined;

	// Get authentication token asynchronously
	void (async (): Promise<void> => {
		try {
			const userToken = await getSupabaseAuthToken();
			const supabaseClient = getSupabaseClient(userToken);

			if (supabaseClient === undefined) {
				console.warn("[subscribeToSongLibrary] No Supabase client");
				return undefined;
			}
			client = supabaseClient;
			// Subscribe to song_library changes
			// RLS policy will automatically filter to user's own entries
			// Don't add a filter - let RLS handle authorization
			// Capture client reference for use in callback
			const capturedClient = client;
			// Use a unique channel name with timestamp to avoid stale connections
			const channelName = `song_library_changes_${Date.now()}`;
			channel = client
				.channel(channelName)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "song_library",
					},
					(payload: unknown) => {
						// Use an async IIFE to avoid passing an async function where a
						// synchronous callback is expected (prevents no-misused-promises).
						void (async (): Promise<void> => {
							const { addSongLibraryEntry, removeSongLibraryEntry } = get();

							/**
							 * Type guard for Supabase realtime `postgres_changes` payloads used by the
							 * song library subscription. Verifies the presence of an `eventType` string.
							 *
							 * @param value - Payload to inspect
							 * @returns true if payload appears to be a valid library change event
							 */
							function isLibraryPayload(value: unknown): value is {
								eventType: "INSERT" | "UPDATE" | "DELETE";
								new?: unknown;
								old?: unknown;
							} {
								if (!isRecord(value)) {
									return false;
								}
								const { eventType } = value;
								return isString(eventType);
							}

							/**
							 * Type guard asserting the minimal shape of a `SongLibraryEntry` as received
							 * from the realtime payload (requires `song_id` and `song_owner_id`).
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

							if (!isLibraryPayload(payload)) {
								return;
							}

							const { eventType } = payload;

							switch (eventType) {
								case "INSERT":
								case "UPDATE": {
									const newEntry = payload.new;
									if (newEntry === undefined) {
										break;
									}

									if (!isSongLibraryEntry(newEntry)) {
										// Can't work with malformed payload; skip
										break;
									}

									const songLibraryEntry = newEntry;

									try {
										// Query user_public for the owner's username
										// Type as unknown to handle Supabase SDK's any return type safely
										const queryResult: unknown = await capturedClient
											.from("user_public")
											.select("username")
											.eq("user_id", songLibraryEntry.song_owner_id)
											.single();

										// Extract data and error using type guards
										// Use intermediate variables to avoid any type issues
										const rawData = isRecord(queryResult) ? queryResult["data"] : undefined;
										const rawError = isRecord(queryResult) ? queryResult["error"] : undefined;
										const userData: unknown = rawData;
										const userError: unknown = rawError;
										if (
											userError !== null ||
											userData === null ||
											!isRecord(userData) ||
											!isString(userData["username"])
										) {
											console.warn(
												"[subscribeToSongLibrary] Could not fetch owner username:",
												userError,
											);
											addSongLibraryEntry(songLibraryEntry);
										} else {
											addSongLibraryEntry({
												...songLibraryEntry,
												owner_username: userData["username"],
											});
										}
									} catch (error) {
										console.warn("[subscribeToSongLibrary] Error fetching owner username:", error);
									}

									break;
								}
								case "DELETE": {
									const oldEntry = payload.old;
									// Safely extract song_id if present
									try {
										const idRaw = isRecord(oldEntry) ? oldEntry["song_id"] : undefined;
										if (isString(idRaw)) {
											removeSongLibraryEntry(idRaw);
										}
									} catch {
										// ignore malformed old entry
									}
									break;
								}
							}
						})();
					},
				)
				.subscribe((status: string, err: unknown) => {
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						// Subscription successful - no logging needed in production
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)) {
						console.error("[subscribeToSongLibrary] Channel error:", err);
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)) {
						console.warn("[subscribeToSongLibrary] Subscription timed out");
					}
				});
		} catch (error) {
			console.error("[subscribeToSongLibrary] Failed to get auth token:", error);
		}
	})();

	// Return a cleanup function that will unsubscribe when called
	return (): void => {
		if (channel !== undefined && client !== undefined) {
			console.warn("[subscribeToSongLibrary] Cleaning up channel subscription");
			void client.removeChannel(channel);
		}
	};
}
