import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityEventAddPath } from "@/shared/paths";
import { type CommunityEventAddPayload } from "@/shared/validation/communitySchemas";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * API call that associates an event with a community and flips slice state.
 *
 * @param communityId - target community id
 * @param eventId - event to add
 * @param get - slice accessor returning state helpers
 * @returns effect which resolves when the backend operation completes
 */
export default function addEventToCommunity(
	communityId: string,
	eventId: string,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addEventToCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		setCommunityLoading(true);
		setCommunityError(undefined);

		const payload: CommunityEventAddPayload = {
			community_id: communityId,
			event_id: eventId,
		};
		yield* $(postJson(apiCommunityEventAddPath, payload));

		setCommunityLoading(false);
	}).pipe(
		// mirror the pattern used elsewhere: always clear loading state and
		// record the error when the effect fails
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
