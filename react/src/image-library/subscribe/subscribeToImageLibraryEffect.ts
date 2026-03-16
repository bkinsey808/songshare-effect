import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import handleImageLibraryEvent from "./handleImageLibraryEvent";

/**
 * Establishes a Supabase Realtime subscription to `image_library`.
 * Returns an Effect that resolves to a cleanup function.
 *
 * @param get - Getter for the `ImageLibrarySlice`.
 * @returns An Effect that resolves to a `() => void` cleanup function.
 */
export default function subscribeToImageLibraryEffect(
	get: () => ImageLibrarySlice,
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
			tableName: "image_library",
			onEvent: (payload: unknown) =>
				handleImageLibraryEvent(payload, supabaseClient, get),
		});

		if (cleanup === undefined) {
			return yield* $(Effect.fail(new Error("Failed to create subscription")));
		}

		return (): void => {
			cleanup();
		};
	});
}
