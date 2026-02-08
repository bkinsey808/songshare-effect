import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import handleEventLibrarySubscribeEvent from "./handleEventLibrarySubscribeEvent";

/**
 * Establishes a realtime subscription to the `event_library` table. Returns
 * an Effect that resolves to a cleanup function which removes the
 * subscription when called. Errors during setup are communicated via the
 * Effect error channel.
 *
 * @param get - Getter for the `EventLibrarySlice` used by event handlers.
 * @returns - An Effect that resolves to a `() => void` cleanup function.
 */
export default function subscribeToEventLibraryEffect(
	get: () => EventLibrarySlice,
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
			tableName: "event_library",
			onEvent: (payload: unknown) => handleEventLibrarySubscribeEvent(payload, supabaseClient, get),
		});

		if (cleanup === undefined) {
			return yield* $(Effect.fail(new Error("Failed to create subscription")));
		}

		return (): void => {
			cleanup();
		};
	});
}
