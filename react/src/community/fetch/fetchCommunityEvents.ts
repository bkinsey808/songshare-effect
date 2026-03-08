import { Effect } from "effect";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityEvent } from "../community-types";
import cloneCommunityRow from "./cloneCommunityRow";

const EMPTY_COUNT = 0;

/**
 * Loads community events and enriches them with public event metadata.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @returns effect that yields enriched community events
 */
export default function fetchCommunityEvents(
	client: SupabaseClientLike<Database>,
	communityId: string,
): Effect.Effect<CommunityEvent[], Error> {
	return Effect.gen(function* fetchCommunityEventsGen($) {
		const eventsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<CommunityEvent>(client, "community_event", {
						cols: "*",
						eq: { col: "community_id", val: communityId },
					}),
				catch: (err) =>
					new Error(`Failed to fetch events: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const rawEventsData: CommunityEvent[] = eventsRes.data ?? [];
		const eventIds = rawEventsData.map((event) => event.event_id);
		if (eventIds.length === EMPTY_COUNT) {
			return [];
		}

		const eventDetailsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<{
						event_id: string;
						event_name: string;
						event_slug: string;
					}>(client, "event_public", {
						cols: "event_id, event_name, event_slug",
						in: { col: "event_id", vals: eventIds },
					}),
				catch: (err) =>
					new Error(`Failed to fetch event details: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const eventDetailMap = new Map(
			(eventDetailsRes.data ?? []).map((details) => [details.event_id, details]),
		);

		return rawEventsData.map((communityEvent) => {
			const enrichedEvent = cloneCommunityRow(communityEvent);
			enrichedEvent.event_name = eventDetailMap.get(communityEvent.event_id)?.event_name;
			enrichedEvent.event_slug = eventDetailMap.get(communityEvent.event_id)?.event_slug;
			return enrichedEvent;
		});
	});
}
