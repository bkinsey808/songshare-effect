import type { SongLibraryEntry } from "./song-library-schema";
import type { SongLibrarySlice } from "./song-library-slice";

export function subscribeToLibrary(
	get: () => SongLibrarySlice,
): (() => void) | undefined {
	let unsubscribeFn: (() => void) | undefined;

	// Get authentication token asynchronously
	void (async () => {
		try {
			const { getSupabaseAuthToken } = await import(
				"@/react/supabase/getSupabaseAuthToken"
			);
			const { getSupabaseClient } = await import(
				"@/react/supabase/supabaseClient"
			);
			const { REALTIME_SUBSCRIBE_STATES } = await import(
				"@supabase/supabase-js"
			);

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
					"postgres_changes" as "system",
					{
						event: "*",
						schema: "public",
						table: "song_library",
					},
					async (payload: unknown) => {
						const { addLibraryEntry, removeLibraryEntry } = get();
						const typedPayload = payload as {
							eventType: "INSERT" | "UPDATE" | "DELETE";
							new?: SongLibraryEntry;
							old?: SongLibraryEntry;
						};

						switch (typedPayload.eventType) {
							case "INSERT":
							case "UPDATE": {
								if (typedPayload.new !== undefined) {
									// For new/updated entries, fetch the owner's username
									const songLibraryEntry = typedPayload.new;

									try {
										// Fetch the owner's username from user_public table
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
											// Still add the entry without username
											addLibraryEntry(songLibraryEntry);
										} else {
											// Add the entry with owner username
											addLibraryEntry({
												...songLibraryEntry,
												owner_username: userData.username,
											});
										}
									} catch (error) {
										console.warn(
											"[subscribeToLibrary] Error fetching owner username:",
											error,
										);
										// Still add the entry without username
										addLibraryEntry(songLibraryEntry);
									}
								}
								break;
							}
							case "DELETE": {
								if (typedPayload.old?.song_id !== undefined) {
									removeLibraryEntry(typedPayload.old.song_id);
								}
								break;
							}
							default:
								break;
						}
					},
				)
				.subscribe((status: string, err: unknown) => {
					if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
						// Subscription successful - no logging needed in production
					} else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
						console.error("[subscribeToLibrary] Channel error:", err);
					} else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
						console.warn("[subscribeToLibrary] Subscription timed out");
					}
				});

			unsubscribeFn = () => {
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
