import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";


import { ITEM_TYPE_CONFIG, ITEM_TYPES } from "@/react/tag/item-type";
import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import handleTagCountsSubscribeEvent from "./handleTagCountsSubscribeEvent";

/**
 * Subscribes to all five item-type junction tables (song_tag, playlist_tag,
 * event_tag, community_tag, image_tag). On INSERT or DELETE, if the affected
 * `tag_slug` belongs to the current user's library, all counts are re-fetched.
 * Returns an Effect that resolves to a single cleanup function that tears down
 * all five subscriptions.
 *
 * @param get - Getter for the `TagLibrarySlice`.
 * @returns An Effect resolving to a cleanup function.
 */
export default function subscribeToTagCountsEffect(
	get: () => TagLibrarySlice,
): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribeToTagCountsGen($) {
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const cleanups = ITEM_TYPES.map((itemType) =>
			createRealtimeSubscription({
				client,
				tableName: ITEM_TYPE_CONFIG[itemType].tagTable,
				onEvent: (payload): Effect.Effect<void, Error> =>
					handleTagCountsSubscribeEvent(payload, get),
			}),
		);

		return (): void => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	});
}
