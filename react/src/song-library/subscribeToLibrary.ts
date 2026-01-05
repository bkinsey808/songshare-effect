import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { getSupabaseAuthToken } from "@/react/supabase/getSupabaseAuthToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type SongLibraryEntry } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

export default function subscribeToLibrary(get: () => SongLibrarySlice): (() => void) | undefined {
	let unsubscribeFn: (() => void) | undefined = undefined;

	// Get authentication token asynchronously
	void (async (): Promise<void> => {
		try {
			const userToken = await getSupabaseAuthToken();
			const client = getSupabaseClient(userToken);

			if (client === undefined) {
				console.warn("[subscribeToLibrary] No Supabase client");
				return undefined;
			}

			// Subscribe to all song_library changes for the authenticated user
			// Join with user_public to get the owner's username
			const channel = client
				.channel("song_library_changes")
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
							const { addLibraryEntry, removeLibraryEntry } = get();

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
										const { data: userData, error: userError } = await client
											.from("user_public")
											.select("username")
											.eq("user_id", songLibraryEntry.song_owner_id)
											.single();

										if (userError || !userData?.username) {
											console.warn(
												"[subscribeToLibrary] Could not fetch owner username:",
												userError,
											);
											addLibraryEntry(songLibraryEntry);
										} else {
											addLibraryEntry({
												...songLibraryEntry,
												owner_username: userData.username,
											});
										}
									} catch (error) {
										console.warn("[subscribeToLibrary] Error fetching owner username:", error);
										addLibraryEntry(songLibraryEntry);
									}

									break;
								}
								case "DELETE": {
									const oldEntry = payload.old;
									// Safely extract song_id if present
									try {
										const idRaw = isRecord(oldEntry) ? oldEntry["song_id"] : undefined;
										if (isString(idRaw)) {
											removeLibraryEntry(idRaw);
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
						console.error("[subscribeToLibrary] Channel error:", err);
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)) {
						console.warn("[subscribeToLibrary] Subscription timed out");
					}
				});

			unsubscribeFn = (): void => {
				void client.removeChannel(channel);
			};
		} catch (error) {
			console.error("[subscribeToLibrary] Failed to get auth token:", error);
		}
	})();

	// Return a function that calls the unsubscribe function when available
	return (): void => {
		if (unsubscribeFn) {
			unsubscribeFn();
		}
	};
}
