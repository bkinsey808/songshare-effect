import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunitySetActiveEventPath } from "@/shared/paths";
import { type CommunitySetActiveEventPayload } from "@/shared/validation/communitySchemas";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * API call that sets or clears the active event for a community.
 *
 * @param communityId - target community id
 * @param eventId - event to set as active, or undefined to clear
 * @param get - slice accessor returning state helpers
 * @returns effect which resolves when the backend operation completes
 */
export default function setActiveEventForCommunity(
	communityId: string,
	eventId: string | undefined,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* setActiveEventForCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		setCommunityLoading(true);
		setCommunityError(undefined);

		const payload: CommunitySetActiveEventPayload = {
			community_id: communityId,
			...(eventId === undefined ? {} : { event_id: eventId }),
		};
		yield* $(postJson(apiCommunitySetActiveEventPath, payload));

		setCommunityLoading(false);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
