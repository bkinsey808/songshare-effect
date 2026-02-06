import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/supabase/subscription/realtime/createRealtimeSubscription";

import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import handleUserPublicSubscribeEvent from "./handleUserPublicSubscribeEvent";

/**
 * subscribeToUserPublicForLibrary
 *
 * Establishes a realtime subscription to the `user_public` table to monitor
 * username changes for users in the current user's library. Returns an Effect
 * that resolves to a cleanup function. Errors during setup are communicated
 * via the Effect error channel.
 *
 * @param get - Getter for the `UserLibrarySlice` used by event handlers.
 * @returns - An Effect that resolves to a `() => void` cleanup function.
 */
export default function subscribeToUserPublicForLibrary(
	get: () => UserLibrarySlice,
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
			tableName: "user_public",
			onEvent: (payload: unknown) => handleUserPublicSubscribeEvent(payload, get),
		});

		return (): void => {
			cleanup();
		};
	});
}
