import { Effect } from "effect";

import type getSupabaseClient from "@/react/supabase/client/getSupabaseClient";

import enrichWithOwnerUsername from "@/react/supabase/enrichment/enrichWithOwnerUsername";
import extractNewRecord from "@/react/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/supabase/subscription/realtime/isRealtimePayload";

import type { SongLibrarySlice } from "../song-library-slice";

import isSongLibraryEntry from "../guards/isSongLibraryEntry";

/**
 * Handle a realtime subscription event payload for the song_library table.
 * Returns an Effect that processes INSERT/UPDATE/DELETE events.
 */
export default function handleSongLibrarySubscribeEvent(
	payload: unknown,
	supabaseClient: Exclude<ReturnType<typeof getSupabaseClient>, undefined>,
	get: () => SongLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
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
				const enrichedEntry = yield* $(
					Effect.tryPromise({
						try: () => enrichWithOwnerUsername(supabaseClient, newEntry, "song_owner_id"),
						catch: (err) => new Error(String(err)),
					}),
				);

				yield* $(
					Effect.sync(() => {
						addSongLibraryEntry(enrichedEntry);
					}),
				);
				break;
			}
			case "DELETE": {
				const oldEntry = payload.old;
				const songId = extractStringField(oldEntry, "song_id");
				if (songId !== undefined) {
					yield* $(
						Effect.sync(() => {
							removeSongLibraryEntry(songId);
						}),
					);
				}
				break;
			}
		}
	});
}
