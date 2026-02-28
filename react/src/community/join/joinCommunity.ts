import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Sends a request to join the specified community and updates slice state.
 *
 * Loading and error fields on the slice are managed automatically.
 *
 * @param communityId - id of the community to join
 * @param get - accessor for the community slice helpers
 * @returns effect that completes when the join call finishes
 */
export default function joinCommunity(
	communityId: string,
	get: () => CommunitySlice,
	options?: { silent?: boolean },
): Effect.Effect<void, Error> {
	return Effect.gen(function* joinCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		const silent = options?.silent === true;

		if (!silent) {
			setCommunityLoading(true);
		}
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () => postJson(apiCommunityUserJoinPath, { community_id: communityId }),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunityLoading(false);
	}).pipe(
		// if the effect fails we still need to clear the loading flag and surface
		// the error message back on the slice so the UI can react
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
