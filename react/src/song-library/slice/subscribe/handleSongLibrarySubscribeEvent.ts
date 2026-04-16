import { Effect } from "effect";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import enrichWithOwnerUsername from "@/react/lib/supabase/enrichment/enrichWithOwnerUsername";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import isRecord from "@/shared/type-guards/isRecord";

import isSongLibraryEntry from "../guards/isSongLibraryEntry";
import type { SongLibrarySlice } from "../song-library-slice";

/**
 * Extract a `user_id` (owner id) from a PostgREST-style result object used
 * by `callSelect` (shape: { data: [...] }). Returns `undefined` when the
 * expected shape is not present.
 *
 * @param result - result returned from a PostgREST `select` call
 * @returns owner `user_id` string or `undefined` when not found
 */
function extractOwnerIdFromResult(result: unknown): string | undefined {
	if (!isRecord(result) || !Array.isArray(result["data"])) {
		return undefined;
	}
	const rows: unknown[] = result["data"];
	const firstRow = rows.find((row) => isRecord(row));
	return typeof firstRow?.["user_id"] === "string" ? firstRow["user_id"] : undefined;
}

/**
 * Handle a realtime subscription event payload for the song_library table.
 *
 * @param payload - realtime payload object from Supabase
 * @param supabaseClient - initialized Supabase client used for enrichment queries
 * @param get - getter that returns the current `SongLibrarySlice`
 * @returns Effect that processes INSERT/UPDATE/DELETE events
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

				// Fetch song owner from song_public to derive song_owner_id
				const songPublicRes = yield* $(
					Effect.tryPromise({
						try: () =>
							callSelect(supabaseClient, "song_public", {
								cols: "user_id",
								eq: { col: "song_id", val: newEntry.song_id },
							}),
						catch: (err) => new Error(String(err)),
					}).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
				);
				const songOwnerId = extractOwnerIdFromResult(songPublicRes);

				const entryWithOwner = {
					...newEntry,
					...(songOwnerId === undefined ? {} : { song_owner_id: songOwnerId }),
				};

				// Enrich with owner username if available
				const enrichedEntry = yield* $(
					Effect.tryPromise({
						try: () => enrichWithOwnerUsername(supabaseClient, entryWithOwner, "song_owner_id"),
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
