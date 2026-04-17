import { Effect } from "effect";

import acceptPendingSharesForItem from "@/react/share/effects/acceptPendingSharesForItem";
import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";
import { type CommunityUserJoinPayload } from "@/shared/validation/communitySchemas";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Sends a request to join the specified community and updates slice state.
 *
 * Loading and error fields on the slice are managed automatically.
 *
 * @param communityId - id of the community to join
 * @param get - accessor for the community slice helpers
 * @param options - optional settings; set `silent: true` to avoid toggling loading
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

		const payload: CommunityUserJoinPayload = { community_id: communityId };
		yield* $(postJson(apiCommunityUserJoinPath, payload));

		// Accept any pending shares for this community (non-fatal)
		yield* $(
			acceptPendingSharesForItem("community", communityId, get).pipe(
				Effect.catchAll(() => Effect.succeed(undefined)),
			),
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
