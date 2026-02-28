import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserRemovePath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Request to leave a community and mirror the status on the slice.
 *
 * Clears loading state and records any errors automatically.
 *
 * @param communityId - id of the community being left
 * @param get - accessor for the community slice helpers
 * @returns effect that completes when the leave API call finishes
 */
export default function leaveCommunity(
	communityId: string,
	get: () => CommunitySlice,
	options?: { silent?: boolean },
): Effect.Effect<void, Error> {
	return Effect.gen(function* leaveCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		const silent = options?.silent === true;

		if (!silent) {
			setCommunityLoading(true);
		}
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () => postJson(apiCommunityUserRemovePath, { community_id: communityId }),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunityLoading(false);
	}).pipe(
		// treat failure the same way as other slice effects
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				if (options?.silent !== true) {
					setCommunityLoading(false);
				}
				setCommunityError(err.message);
			}),
		),
	);
}
