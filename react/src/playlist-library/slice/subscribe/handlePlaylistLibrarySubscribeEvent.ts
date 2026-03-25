import { Effect } from "effect";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import enrichWithOwnerUsername from "@/react/lib/supabase/enrichment/enrichWithOwnerUsername";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import isRecord from "@/shared/type-guards/isRecord";

import type { PlaylistLibrary } from "../playlist-library-types";
import type { PlaylistLibrarySlice } from "../PlaylistLibrarySlice.type";

/**
 * Validates that a value is a valid PlaylistLibrary record.
 * @param value - The value to check.
 * @returns True if the value is a valid PlaylistLibrary.
 */
function isPlaylistLibraryEntry(value: unknown): value is PlaylistLibrary {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value["user_id"] === "string" && typeof value["playlist_id"] === "string";
}

function extractOwnerIdFromResult(result: unknown): string | undefined {
	if (!isRecord(result) || !Array.isArray(result["data"])) {
		return undefined;
	}
	const rows: unknown[] = result["data"];
	const firstRow = rows.find((row) => isRecord(row));
	return typeof firstRow?.["user_id"] === "string" ? firstRow["user_id"] : undefined;
}

/**
 * Handle a realtime subscription event payload for the playlist_library table.
 * Returns an Effect that processes INSERT/UPDATE/DELETE events.
 *
 * @param payload - The realtime event payload
 * @param supabaseClient - Supabase client for enrichment queries
 * @param get - Zustand slice getter
 * @returns Effect that processes the event
 */
export default function handlePlaylistLibrarySubscribeEvent(
	payload: unknown,
	supabaseClient: Exclude<ReturnType<typeof getSupabaseClient>, undefined>,
	get: () => PlaylistLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
		const { addPlaylistLibraryEntry, removePlaylistLibraryEntry } = get();

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

				if (!isPlaylistLibraryEntry(newEntry)) {
					// Can't work with malformed payload; skip
					break;
				}

				// Fetch playlist owner from playlist_public to derive playlist_owner_id
				const playlistPublicRes = yield* $(
					Effect.tryPromise({
						try: () =>
							callSelect(supabaseClient, "playlist_public", {
								cols: "user_id",
								eq: { col: "playlist_id", val: newEntry.playlist_id },
							}),
						catch: (err) => new Error(String(err)),
					}).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
				);
				const playlistOwnerId = extractOwnerIdFromResult(playlistPublicRes);

				const entryWithOwner = {
					...newEntry,
					...(playlistOwnerId === undefined ? {} : { playlist_owner_id: playlistOwnerId }),
				};

				// Enrich with owner username if available
				const enrichedEntry = yield* $(
					Effect.tryPromise({
						try: () => enrichWithOwnerUsername(supabaseClient, entryWithOwner, "playlist_owner_id"),
						catch: (err) => new Error(String(err)),
					}),
				);

				yield* $(
					Effect.sync(() => {
						addPlaylistLibraryEntry(enrichedEntry);
					}),
				);
				break;
			}
			case "DELETE": {
				const oldEntry = payload.old;
				const playlistId = extractStringField(oldEntry, "playlist_id");
				if (playlistId !== undefined) {
					yield* $(
						Effect.sync(() => {
							removePlaylistLibraryEntry(playlistId);
						}),
					);
				}
				break;
			}
		}
	});
}
