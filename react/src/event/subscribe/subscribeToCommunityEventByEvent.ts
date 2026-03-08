import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { EventSlice } from "../slice/EventSlice.type";
import handleCommunityEventByEventSubscribeEvent from "./handleCommunityEventByEventSubscribeEvent";

/**
 * Establishes a realtime subscription to `community_event` rows for the
 * given event. Returns an Effect that resolves to a cleanup function.
 *
 * On INSERT a silent re-fetch populates enriched community data.
 * On DELETE the community row is removed from slice state immediately.
 *
 * @param eventId - The event whose community memberships are being watched
 * @param get - Getter for the EventSlice
 * @returns An Effect resolving to a cleanup function
 */
export default function subscribeToCommunityEventByEvent(
	eventId: string,
	get: () => EventSlice,
): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribeGen($) {
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => Promise.resolve(getSupabaseAuthToken()),
				catch: (err) => new Error(String(err)),
			}),
		);

		const supabaseClient = getSupabaseClient(userToken);
		if (supabaseClient === undefined) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const cleanup = createRealtimeSubscription({
			client: supabaseClient,
			tableName: "community_event",
			filter: `event_id=eq.${eventId}`,
			onEvent: (payload: unknown) =>
				handleCommunityEventByEventSubscribeEvent(payload, eventId, get),
		});

		return (): void => {
			cleanup();
		};
	});
}
