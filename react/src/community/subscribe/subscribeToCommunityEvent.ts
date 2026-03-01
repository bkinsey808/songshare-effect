import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import handleCommunityEventSubscribeEvent from "./handleCommunityEventSubscribeEvent";

/**
 * Establishes a realtime subscription to `community_event` rows for the
 * given community. Returns an Effect that resolves to a cleanup function.
 *
 * On INSERT a silent re-fetch populates enriched event data.
 * On DELETE the event is removed from slice state immediately.
 *
 * @param communityId - The community whose events are being watched
 * @param get - Getter for the CommunitySlice
 * @returns An Effect resolving to a cleanup function
 */
export default function subscribeToCommunityEvent(
	communityId: string,
	get: () => CommunitySlice,
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
			filter: `community_id=eq.${communityId}`,
			onEvent: (payload: unknown) => handleCommunityEventSubscribeEvent(payload, get),
		});

		return (): void => {
			cleanup();
		};
	});
}
