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
 * Normalize realtime payload to our expected shape.
 * Supabase realtime-js may pass either:
 * - Normalized: { eventType, new?, old? }
 * - Wrapped: { ids?, data: { type, record?, old_record? } }
 * This returns the normalized form so handlers can assume eventType/new/old.
 */
function normalizeSongPublicPayload(payload: unknown): unknown {
	if (!isRecord(payload)) {
		return payload;
	}
	const { eventType: existingType } = payload as { eventType?: string };
	if (typeof existingType === "string") {
		return payload;
	}
	const { data } = payload as { data?: unknown };
	if (!isRecord(data) || typeof data["type"] !== "string") {
		return payload;
	}
	return {
		eventType: data["type"],
		new: isRecord(data["record"]) ? data["record"] : undefined,
		old: isRecord(data["old_record"]) ? data["old_record"] : undefined,
		errors: data["errors"],
	};
}

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
		const normalized = normalizeSongPublicPayload(payload);
		if (!isRealtimePayload(normalized)) {
			return;
		}

		// Debug: incoming realtime payload for song_public
		console.warn("[song_public] Received payload:", normalized);
		switch (normalized.eventType) {
			case "INSERT":
			case "UPDATE": {
				const newRecord = extractNewRecord(normalized);
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
				const songId = extractStringField(normalized.old, "song_id");
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

/** Supabase realtime in-filter allows at most 100 values. */
const REALTIME_IN_FILTER_MAX = 100;
const REALTIME_IN_FILTER_START = 0;

/**
 * Build PostgREST-style in-filter for song_id. UUIDs must be double-quoted so
 * hyphens are not parsed as operators. Format: song_id=in.("id1","id2",...)
 */
function buildSongIdInFilter(uniqueIds: readonly string[]): string {
	const quoted = uniqueIds
		.slice(REALTIME_IN_FILTER_START, REALTIME_IN_FILTER_MAX)
		.map((id) => `"${String(id).replaceAll('"', String.raw`\"`)}"`)
		.join(",");
	return `song_id=in.(${quoted})`;
}

/**
 * Create a realtime subscription to `song_public` for the provided song IDs.
 *
 * Uses a scoped `in` filter (song_id=in.("id1","id2",...)) so only changes for
 * those songs are delivered. UUIDs are double-quoted per PostgREST/realtime
 * rules. If there are more than 100 IDs, only the first 100 are filtered;
 * handleSongPublicPayload still applies updates only when the song is in the
 * current library.
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
		const filter = buildSongIdInFilter(uniqueIds);
		const filterCount = Math.min(uniqueIds.length, REALTIME_IN_FILTER_MAX);
		if (uniqueIds.length > REALTIME_IN_FILTER_MAX) {
			console.warn(
				`[subscribeToSongPublic] Library has ${uniqueIds.length} songs; filter limited to first ${REALTIME_IN_FILTER_MAX}`,
			);
		}
		console.warn(`[subscribeToSongPublic] Creating subscription: ${channelName} filter for ${filterCount} song(s)`);

		const cleanup = createRealtimeSubscription({
			client,
			tableName: "song_public",
			channelName,
			filter,
			onEvent: (payload: unknown) => handleSongPublicPayload(payload, get),
			onStatus: (status: string, err: unknown) => {
				console.warn(`[subscribeToSongPublic] status=${status} err=`, err);
			},
		});

		return cleanup;
	});
}
