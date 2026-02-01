import { Effect } from "effect";

import type getSupabaseClient from "@/react/supabase/client/getSupabaseClient";

import enrichWithOwnerUsername from "@/react/supabase/enrichment/enrichWithOwnerUsername";
import extractNewRecord from "@/react/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/supabase/subscription/realtime/isRealtimePayload";
import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibrarySlice } from "../user-library-slice";
import type { UserLibrary } from "../user-library-types";

function isUserLibraryEntry(value: unknown): value is UserLibrary {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value["user_id"] === "string" && typeof value["followed_user_id"] === "string";
}

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
