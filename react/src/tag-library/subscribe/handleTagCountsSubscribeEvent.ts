import { Effect } from "effect";

import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";

/**
 * Processes realtime events for junction-table subscriptions (song_tag,
 * playlist_tag, etc.). On INSERT or DELETE, if the affected `tag_slug`
 * belongs to the current user's library, all tag counts are re-fetched.
 * Non-realtime payloads and UPDATE events are ignored.
 *
 * @param payload - Raw realtime payload from Supabase.
 * @param get - Getter for the `TagLibrarySlice` used to check membership and trigger re-fetch.
 * @returns An Effect that completes after applying the change locally.
 */
export default function handleTagCountsSubscribeEvent(
	payload: unknown,
	get: () => TagLibrarySlice,
): Effect.Effect<void, Error> {
	if (!isRealtimePayload(payload)) {
		return Effect.void;
	}

	const { eventType } = payload;
	if (eventType !== "INSERT" && eventType !== "DELETE") {
		return Effect.void;
	}

	const record = eventType === "DELETE" ? payload.old : payload.new;
	const tagSlug = extractStringField(record, "tag_slug");

	if (tagSlug === undefined) {
		return Effect.void;
	}

	const { getTagLibrarySlugs, fetchTagLibraryCounts } = get();
	if (!getTagLibrarySlugs().includes(tagSlug)) {
		return Effect.void;
	}

	return fetchTagLibraryCounts();
}
