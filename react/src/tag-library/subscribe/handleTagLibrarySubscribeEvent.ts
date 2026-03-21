import { Effect } from "effect";

import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import isTagLibraryEntry from "../fetch/isTagLibraryEntry";
import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";

/**
 * Processes realtime events for the `tag_library` subscription. Handles
 * INSERT by adding the entry, and DELETE by removing the entry from the
 * local slice. Non-realtime payloads are ignored.
 *
 * @param payload - Raw realtime payload from Supabase.
 * @param get - Getter for the `TagLibrarySlice` used to apply changes.
 * @returns An Effect that completes after applying the change locally.
 */
export default function handleTagLibrarySubscribeEvent(
	payload: unknown,
	get: () => TagLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
		const { addTagLibraryEntry, removeTagLibraryEntry } = get();

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
				if (!isTagLibraryEntry(newEntry)) {
					break;
				}
				yield* $(
					Effect.sync(() => {
						addTagLibraryEntry(newEntry);
					}),
				);
				break;
			}
			case "DELETE": {
				const oldEntry = payload.old;
				const tagSlug = extractStringField(oldEntry, "tag_slug");
				if (tagSlug !== undefined) {
					yield* $(
						Effect.sync(() => {
							removeTagLibraryEntry(tagSlug);
						}),
					);
				}
				break;
			}
		}
	});
}
