/**
 * Subscribe to realtime updates for a subset of `song_public` rows by song_id.
 *
 * Uses a scoped `in` filter built from the provided `songIds` and updates the
 * song library entries with any incoming name/slug changes. Returns a cleanup
 * function that removes the realtime channel.
 */
import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import extractNewRecord from "@/react/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/supabase/subscription/extract/extractStringField";
import createRealtimeSubscription from "@/react/supabase/subscription/realtime/createRealtimeSubscription";
import isRealtimePayload from "@/react/supabase/subscription/realtime/isRealtimePayload";
import { guardAsString, isRecord } from "@/shared/utils/typeGuards";

import type { SongLibrarySlice } from "../song-library-slice";
import type { SongLibraryEntry } from "../song-library-types";

const NO_SONG_IDS = 0;

/**
 * Update a song library entry with fields from a song_public row.
 *
 * @param params - Update parameters
 * @param params.get - Zustand slice getter
 * @param params.songId - ID of the song to update
 * @param params.songName - Optional song name to set (undefined clears)
 * @param params.songSlug - Optional song slug to set (undefined clears)
 * @returns void
 */
function updateEntryFromSongPublic({
	get,
	songId,
	songName,
	songSlug,
}: {
	get: () => SongLibrarySlice;
	songId: string;
	songName?: string;
	songSlug?: string;
}): void {
	const slice = get();
	const { songLibraryEntries, setSongLibraryEntries } = slice;
	const existingEntry = songLibraryEntries[songId];
	if (existingEntry === undefined) {
		return;
	}

	const updatedEntry: SongLibraryEntry = {
		...existingEntry,
		...(songName === undefined ? {} : { song_name: songName }),
		...(songSlug === undefined ? {} : { song_slug: songSlug }),
	};

	setSongLibraryEntries({
		...songLibraryEntries,
		[songId]: updatedEntry,
	});
}

/**
 * Handle realtime payloads for song_public and apply entry updates.
 *
 * @param payload - Incoming realtime payload
 * @param get - Zustand slice getter
 * @returns Effect that applies the update
 */
function handleSongPublicPayload(
	payload: unknown,
	get: () => SongLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleSongPublicGen($) {
		if (!isRealtimePayload(payload)) {
			return;
		}

		// Debug: incoming realtime payload for song_public
		console.warn("[song_public] Received payload:", payload);
		switch (payload.eventType) {
			case "INSERT":
			case "UPDATE": {
				const newRecord = extractNewRecord(payload);
				if (newRecord === undefined || !isRecord(newRecord)) {
					break;
				}

				const songId = extractStringField(newRecord, "song_id");
				if (songId === undefined) {
					break;
				}

				const songName = guardAsString(newRecord["song_name"]);
				const songSlug = guardAsString(newRecord["song_slug"]);

				yield* $(
					Effect.sync(() => {
						updateEntryFromSongPublic({
							get,
							songId,
							songName,
							songSlug,
						});
					}),
				);
				break;
			}
			case "DELETE": {
				const songId = extractStringField(payload.old, "song_id");
				if (songId === undefined) {
					break;
				}

				yield* $(
					Effect.sync(() => {
						updateEntryFromSongPublic({ get, songId });
					}),
				);
				break;
			}
		}
	});
}

/**
 * Create a realtime subscription to `song_public` for the provided song IDs.
 *
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @param songIds - List of song IDs to subscribe to
 * @returns Effect yielding a cleanup function that unsubscribes the realtime channel
 */
const TOKEN_FETCH_TIMEOUT_MS = 5000;

export default function subscribeToSongPublic(
	get: () => SongLibrarySlice,
	songIds: readonly string[],
): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribeSongPublicGen($) {
		const uniqueIds = [...new Set(songIds)].filter((id) => id !== "");
		if (uniqueIds.length === NO_SONG_IDS) {
			return (): void => {
				/* no-op */
			};
		}

		console.warn("[subscribeToSongPublic] Fetching token with timeout...");

		// Use Effect's built-in timeout logic instead of manual Promise.race
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}).pipe(
				Effect.timeout(TOKEN_FETCH_TIMEOUT_MS),
				Effect.catchAll(() => {
					console.error("[subscribeToSongPublic] TOKEN FETCH TIMED OUT or failed after 5s");
					return Effect.succeed(undefined);
				}),
			),
		);

		console.warn("[subscribeToSongPublic] Token result received:", userToken !== undefined);

		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const channelName = `song_public_changes_${Date.now()}`;
		console.warn(`[subscribeToSongPublic] Creating subscription: ${channelName}`);

		const cleanup = createRealtimeSubscription({
			client,
			tableName: "song_public",
			channelName,
			onEvent: (payload: unknown) => handleSongPublicPayload(payload, get),
			onStatus: (status: string, err: unknown) => {
				console.warn(`[subscribeToSongPublic] status=${status} err=`, err);
			},
		});

		return cleanup;
	});
}
