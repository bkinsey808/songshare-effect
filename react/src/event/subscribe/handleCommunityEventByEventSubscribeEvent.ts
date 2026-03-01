import { Effect } from "effect";

import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import type { EventSlice } from "../slice/EventSlice.type";

import fetchEventCommunities from "../fetch/fetchEventCommunities";

/**
 * Handles realtime subscription events for `community_event` scoped to a
 * specific event.
 *
 * On INSERT a silent re-fetch populates enriched community data (name, slug).
 * On DELETE the community row is removed from slice state using the old-row
 * payload guaranteed by REPLICA IDENTITY FULL.
 *
 * @param payload - The raw realtime event payload
 * @param eventId - The event whose community memberships are being watched
 * @param get - Getter for the EventSlice
 * @returns An Effect that applies the state change
 */
export default function handleCommunityEventByEventSubscribeEvent(
	payload: unknown,
	eventId: string,
	get: () => EventSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleGen($) {
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload as Record<string, unknown>;
		const { removeEventCommunity } = get();

		if (eventType === "INSERT") {
			// Trigger a silent refetch to get enriched community data (name, slug)
			yield* $(fetchEventCommunities(eventId, get, { silent: true }));
		} else if (eventType === "DELETE") {
			const communityId = extractStringField(
				(payload as Record<string, unknown>)["old"],
				"community_id",
			);
			if (communityId !== undefined) {
				yield* $(
					Effect.sync(() => {
						removeEventCommunity(communityId);
					}),
				);
			}
		}
	});
}
