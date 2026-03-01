import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import handleCommunityPublicSubscribeEvent from "./handleCommunityPublicSubscribeEvent";

/**
 * Establishes a realtime subscription to `community_public` for the given
 * community. Returns an Effect that resolves to a cleanup function.
 *
 * Handles UPDATE events to keep `currentCommunity` (including
 * `active_event_id`) in sync without a full page refetch.
 *
 * @param communityId - The community to watch
 * @param get - Getter for the CommunitySlice
 * @returns An Effect resolving to a cleanup function
 */
export default function subscribeToCommunityPublic(
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
			tableName: "community_public",
			filter: `community_id=eq.${communityId}`,
			onEvent: (payload: unknown) => handleCommunityPublicSubscribeEvent(payload, get),
		});

		return (): void => {
			cleanup();
		};
	});
}
