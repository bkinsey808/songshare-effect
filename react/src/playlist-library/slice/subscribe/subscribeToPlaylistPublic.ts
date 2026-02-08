/**
 * Subscribe to realtime updates for a subset of `playlist_public` rows by playlist_id.
 *
 * Uses a scoped `in` filter built from the provided `playlistIds` and updates the
 * playlist library entries with any incoming name/slug changes. Returns a cleanup
 * function that removes the realtime channel.
 */
import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { PlaylistLibrarySlice } from "../playlist-library-slice";
import type { PlaylistLibraryEntry } from "../playlist-library-types";

const NO_PLAYLIST_IDS = 0;

/**
 * Normalize realtime payload to our expected shape.
 * Supabase realtime-js may pass either:
 * - Normalized: { eventType, new?, old? }
 * - Wrapped: { ids?, data: { type, record?, old_record? } }
 * This returns the normalized form so handlers can assume eventType/new/old.
 *
 * @param payload - The raw payload from Supabase realtime.
 * @returns Normalized payload with eventType, new, and old fields.
 */
function normalizePlaylistPublicPayload(payload: unknown): unknown {
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
 * Update a playlist library entry with fields from a playlist_public row.
 *
 * @param params - Update parameters
 * @param params.get - Zustand slice getter
 * @param params.playlistId - ID of the playlist to update
 * @param params.playlistName - Optional playlist name to set (undefined clears)
 * @param params.playlistSlug - Optional playlist slug to set (undefined clears)
 */
function updateEntryFromPlaylistPublic({
	get,
	playlistId,
	playlistName,
	playlistSlug,
}: {
	get: () => PlaylistLibrarySlice;
	playlistId: string;
	playlistName?: string;
	playlistSlug?: string;
}): void {
	const slice = get();
	const { playlistLibraryEntries, setPlaylistLibraryEntries } = slice;
	const existingEntry = playlistLibraryEntries[playlistId];
	if (existingEntry === undefined) {
		return;
	}

	const updatedEntry: PlaylistLibraryEntry = {
		...existingEntry,
		...(playlistName === undefined ? {} : { playlist_name: playlistName }),
		...(playlistSlug === undefined ? {} : { playlist_slug: playlistSlug }),
	};

	setPlaylistLibraryEntries({
		...playlistLibraryEntries,
		[playlistId]: updatedEntry,
	});
}

/**
 * Handle realtime payloads for playlist_public and apply entry updates.
 *
 * @param payload - Incoming realtime payload
 * @param get - Zustand slice getter
 * @returns Effect that applies the update
 */
function handlePlaylistPublicPayload(
	payload: unknown,
	get: () => PlaylistLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handlePlaylistPublicGen($) {
		const normalized = normalizePlaylistPublicPayload(payload);
		if (!isRealtimePayload(normalized)) {
			return;
		}

		console.warn("[playlist_public] Received payload:", normalized);
		switch (normalized.eventType) {
			case "INSERT":
			case "UPDATE": {
				const newRecord = extractNewRecord(normalized);
				if (newRecord === undefined || !isRecord(newRecord)) {
					break;
				}

				const playlistId = extractStringField(newRecord, "playlist_id");
				if (playlistId === undefined) {
					break;
				}

				const playlistName = guardAsString(newRecord["playlist_name"]);
				const playlistSlug = guardAsString(newRecord["playlist_slug"]);

				yield* $(
					Effect.sync(() => {
						updateEntryFromPlaylistPublic({
							get,
							playlistId,
							playlistName,
							playlistSlug,
						});
					}),
				);
				break;
			}
			case "DELETE": {
				const playlistId = extractStringField(normalized.old, "playlist_id");
				if (playlistId === undefined) {
					break;
				}

				yield* $(
					Effect.sync(() => {
						updateEntryFromPlaylistPublic({ get, playlistId });
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
 * Build PostgREST-style in-filter for playlist_id. UUIDs must be double-quoted so
 * hyphens are not parsed as operators. Format: playlist_id=in.("id1","id2",...)
 *
 * @param uniqueIds - Array of unique playlist IDs to filter.
 * @returns The filter string for Supabase realtime.
 */
function buildPlaylistIdInFilter(uniqueIds: readonly string[]): string {
	const quoted = uniqueIds
		.slice(REALTIME_IN_FILTER_START, REALTIME_IN_FILTER_MAX)
		.map((id) => `"${String(id).replaceAll('"', String.raw`\"`)}"`)
		.join(",");
	return `playlist_id=in.(${quoted})`;
}

const TOKEN_FETCH_TIMEOUT_MS = 5000;

/**
 * Create a realtime subscription to `playlist_public` for the provided playlist IDs.
 *
 * Uses a scoped `in` filter (playlist_id=in.("id1","id2",...)) so only changes for
 * those playlists are delivered. UUIDs are double-quoted per PostgREST/realtime
 * rules. If there are more than 100 IDs, only the first 100 are filtered;
 * handlePlaylistPublicPayload still applies updates only when the playlist is in the
 * current library.
 *
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @param playlistIds - List of playlist IDs to subscribe to
 * @returns Effect yielding a cleanup function that unsubscribes the realtime channel
 */
export default function subscribeToPlaylistPublic(
	get: () => PlaylistLibrarySlice,
	playlistIds: readonly string[],
): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribePlaylistPublicGen($) {
		const uniqueIds = [...new Set(playlistIds)].filter((id) => id !== "");
		if (uniqueIds.length === NO_PLAYLIST_IDS) {
			return (): void => {
				/* no-op */
			};
		}

		console.warn("[subscribeToPlaylistPublic] Fetching token with timeout...");

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}).pipe(
				Effect.timeout(TOKEN_FETCH_TIMEOUT_MS),
				Effect.catchAll(() => {
					console.error("[subscribeToPlaylistPublic] TOKEN FETCH TIMED OUT or failed after 5s");
					return Effect.succeed(undefined);
				}),
			),
		);

		console.warn("[subscribeToPlaylistPublic] Token result received:", userToken !== undefined);

		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const channelName = `playlist_public_changes_${Date.now()}`;
		const filter = buildPlaylistIdInFilter(uniqueIds);
		const filterCount = Math.min(uniqueIds.length, REALTIME_IN_FILTER_MAX);
		if (uniqueIds.length > REALTIME_IN_FILTER_MAX) {
			console.warn(
				`[subscribeToPlaylistPublic] Library has ${uniqueIds.length} playlists; filter limited to first ${REALTIME_IN_FILTER_MAX}`,
			);
		}
		console.warn(
			`[subscribeToPlaylistPublic] Creating subscription: ${channelName} filter for ${filterCount} playlist(s)`,
		);

		const cleanup = createRealtimeSubscription({
			client,
			tableName: "playlist_public",
			channelName,
			filter,
			onEvent: (payload: unknown) => handlePlaylistPublicPayload(payload, get),
			onStatus: (status: string, err: unknown) => {
				console.warn(`[subscribeToPlaylistPublic] status=${status} err=`, err);
			},
		});

		return cleanup;
	});
}
