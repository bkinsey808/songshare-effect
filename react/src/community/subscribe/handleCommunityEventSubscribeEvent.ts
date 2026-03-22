import { Effect } from "effect";

import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Handles realtime subscription events for the `community_event` table
 * scoped to a specific community.
 *
 * On INSERT a silent re-fetch is triggered to populate enriched event data
 * (name, slug). On DELETE the event is removed from local slice state using
 * the old-row payload guaranteed by REPLICA IDENTITY FULL.
 *
 * @param payload - The raw realtime event payload
 * @param get - Getter for the CommunitySlice
 * @returns An Effect that applies the state change
 */
export default function handleCommunityEventSubscribeEvent(
	payload: unknown,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleCommunityEventGen($) {
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload as Record<string, unknown>;
		const { currentCommunity, fetchCommunityBySlug, communityEvents, setCommunityEvents } = get();

		if (eventType === "INSERT") {
			// Trigger a silent refetch to get full event data (name, slug)
			if (currentCommunity !== undefined) {
				yield* $(fetchCommunityBySlug(currentCommunity.community_slug, { silent: true }));
			}
		} else if (eventType === "DELETE") {
			const eventId = extractStringField((payload as Record<string, unknown>)["old"], "event_id");
			if (eventId !== undefined) {
				yield* $(
					Effect.sync(() => {
						setCommunityEvents(communityEvents.filter((ev) => ev.event_id !== eventId));
					}),
				);
			}
		}
	});
}
