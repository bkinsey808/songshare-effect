import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/supabase/subscription/realtime/createRealtimeSubscription";

import type { PlaylistLibrarySlice } from "../playlist-library-slice";

import handlePlaylistLibrarySubscribeEvent from "./handlePlaylistLibrarySubscribeEvent";

/**
 * Subscribe to realtime updates on the current user's `playlist_library` table and
 * apply incoming changes to the provided slice getters (`addPlaylistLibraryEntry` / `removePlaylistLibraryEntry`).
 *
 * The subscription will fetch owner usernames for INSERT/UPDATE events when possible
 * and update the local state optimistically. Returns an Effect that yields a cleanup
 * function to unsubscribe from the realtime channel.
 *
 * @param get - Zustand slice getter used to access mutation helpers
 * @returns An Effect that yields a cleanup function to unsubscribe the realtime channel
 */
export default function subscribeToPlaylistLibrary(
	get: () => PlaylistLibrarySlice,
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

		// Create subscription using the common utility
		const cleanup = createRealtimeSubscription({
			client: supabaseClient,
			tableName: "playlist_library",
			onEvent: (payload: unknown) =>
				handlePlaylistLibrarySubscribeEvent(payload, supabaseClient, get),
		});

		// Return the cleanup function
		return (): void => {
			cleanup();
		};
	});
}
