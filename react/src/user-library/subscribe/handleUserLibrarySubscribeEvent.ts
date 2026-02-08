import { Effect } from "effect";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";

import enrichWithOwnerUsername from "@/react/lib/supabase/enrichment/enrichWithOwnerUsername";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import isUserLibraryEntry from "../guards/isUserLibraryEntry";

/**
 * Processes realtime events for the `user_library` subscription. Handles
 * INSERT/UPDATE by enriching and adding the entry, and DELETE by removing
 * the entry from the local slice. Non-realtime payloads are ignored.
 *
 * @param payload - Raw realtime payload from Supabase.
 * @param supabaseClient - Initialized Supabase client to perform enrichment
 *   calls (e.g., to fetch owner usernames).
 * @param get - Getter for the `UserLibrarySlice` used to apply changes.
 * @returns - An Effect that completes after applying the change locally.
 */
export default function handleUserLibrarySubscribeEvent(
	payload: unknown,
	supabaseClient: Exclude<ReturnType<typeof getSupabaseClient>, undefined>,
	get: () => UserLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
		const { addUserLibraryEntry, removeUserLibraryEntry } = get();

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

				if (!isUserLibraryEntry(newEntry)) {
					break;
				}

				const enrichedEntry = yield* $(
					Effect.tryPromise({
						try: () => enrichWithOwnerUsername(supabaseClient, newEntry, "followed_user_id"),
						catch: (err) => new Error(String(err)),
					}),
				);

				yield* $(
					Effect.sync(() => {
						addUserLibraryEntry(enrichedEntry);
					}),
				);
				break;
			}
			case "DELETE": {
				const oldEntry = payload.old;
				const id = extractStringField(oldEntry, "followed_user_id");
				if (id !== undefined) {
					yield* $(
						Effect.sync(() => {
							removeUserLibraryEntry(id);
						}),
					);
				}
				break;
			}
		}
	});
}
