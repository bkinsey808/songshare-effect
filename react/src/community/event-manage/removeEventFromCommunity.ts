import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityEventRemovePath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Initiates an API request to remove an event from a given community.
 *
 * This action toggles loading state on the community slice and clears any
 * existing error before dispatching a POST to the server.  On failure the
 * error message is written back into the slice and loading is cleared.
 *
 * @param communityId - the database identifier for the community
 * @param eventId - the identifier for the event to remove
 * @param get - callback returning the current community slice helpers
 * @returns an Effect that resolves with `void` or fails with an Error
 */
export default function removeEventFromCommunity(
	communityId: string,
	eventId: string,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeEventFromCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		setCommunityLoading(true);
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () =>
					postJson(apiCommunityEventRemovePath, {
						community_id: communityId,
						event_id: eventId,
					}),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunityLoading(false);
	}).pipe(
		// ensure shared error/loading cleanup logic is executed on failure
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
