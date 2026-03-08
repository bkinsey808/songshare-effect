import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { ShareSlice } from "../slice/ShareSlice.type";
import handleShareSubscribeEvent from "./handleShareSubscribeEvent";

/**
 * Establishes a realtime subscription to shares received by the current user.
 * Subscribes to the `share_public` table filtered by recipient_user_id.
 * Returns an Effect that resolves to a cleanup function.
 *
 * @param get - Getter for the `ShareSlice` used by event handlers.
 * @param currentUserId - The current user's ID for filtering subscriptions.
 * @returns - An Effect that resolves to a `() => void` cleanup function.
 */
export default function subscribeToReceivedShares(
	get: () => ShareSlice,
	currentUserId: string,
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

		// Use the provided user ID for filtering subscriptions
		if (!currentUserId) {
			return yield* $(Effect.fail(new Error("No user ID available for subscription")));
		}

		const cleanup = createRealtimeSubscription({
			client: supabaseClient,
			tableName: "share_public",
			filter: `recipient_user_id=eq.${currentUserId}`,
			onEvent: (payload: unknown) =>
				handleShareSubscribeEvent(payload, supabaseClient, { get, shareType: "received" }),
		});

		return (): void => {
			cleanup();
		};
	});
}
