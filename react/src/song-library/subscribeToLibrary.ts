import type { SongLibraryEntry } from "./song-library-schema";
import type { SongLibrarySlice } from "./song-library-slice";

export function subscribeToLibrary(
	get: () => SongLibrarySlice,
): (() => void) | undefined {
	let unsubscribeFn: (() => void) | undefined;

	// Get authentication token asynchronously
	void (async () => {
		try {
			const { getSupabaseAuthToken } =
				await import("@/react/supabase/getSupabaseAuthToken");
			const { getSupabaseClient } =
				await import("@/react/supabase/supabaseClient");
			const { REALTIME_SUBSCRIBE_STATES } =
				await import("@supabase/supabase-js");

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
						void (async () => {
							const { addLibraryEntry, removeLibraryEntry } = get();

							function isLibraryPayload(x: unknown): x is {
								eventType: "INSERT" | "UPDATE" | "DELETE";
								new?: unknown;
								old?: unknown;
							} {
								if (typeof x !== "object" || x === null) return false;
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
								const obj = x as Record<string, unknown>;
								return (
									Object.prototype.hasOwnProperty.call(obj, "eventType") &&
									typeof obj["eventType"] === "string"
								);
							}

							function isSongLibraryEntry(x: unknown): x is SongLibraryEntry {
								if (typeof x !== "object" || x === null) return false;
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
								const obj = x as Record<string, unknown>;
								return (
									Object.prototype.hasOwnProperty.call(obj, "song_id") &&
									typeof obj["song_id"] === "string" &&
									Object.prototype.hasOwnProperty.call(obj, "user_id") &&
									typeof obj["user_id"] === "string"
								);
							}

							if (!isLibraryPayload(payload)) return;

							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
							const eventTypeRaw = (payload as Record<string, unknown>)[
								"eventType"
							];
							if (typeof eventTypeRaw !== "string") return;
							const eventType = eventTypeRaw;

							switch (eventType) {
								case "INSERT":
								case "UPDATE": {
									const newEntry = (payload as Record<string, unknown>)["new"];
									if (newEntry === undefined) break;

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
									} catch (error_) {
										console.warn(
											"[subscribeToLibrary] Error fetching owner username:",
											error_,
										);
										addLibraryEntry(songLibraryEntry);
									}

									break;
								}
								case "DELETE": {
									// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
									const oldEntry = (payload as Record<string, unknown>)["old"];
									// Safely extract song_id if present
									try {
										// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
										const idRaw = (oldEntry as Record<string, unknown>)?.[
											"song_id"
										];
										if (typeof idRaw === "string") {
											removeLibraryEntry(idRaw);
										}
									} catch {
										// ignore malformed old entry
									}
									break;
								}
							}
						})().catch((e: unknown) => {
							console.warn("[subscribeToLibrary] handler error:", e);
						});
					},
				)
				.subscribe((status: string, err: unknown) => {
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						// Subscription successful - no logging needed in production
					} else if (
						String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)
					) {
						console.error("[subscribeToLibrary] Channel error:", err);
					} else if (
						String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)
					) {
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
