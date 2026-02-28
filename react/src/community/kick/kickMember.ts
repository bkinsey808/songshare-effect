import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserKickPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Remove (kick) a user from a community via API and update slice state.
 *
 * Handles loading/error toggles on the slice automatically.
 *
 * @param communityId - the community from which to remove the user
 * @param userId - the user to kick
 * @param get - function returning the community slice helpers
 * @returns effect resolving after the kick request
 */
export default function kickMember(
	communityId: string,
	userId: string,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* kickMemberGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		setCommunityLoading(true);
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () =>
					postJson(apiCommunityUserKickPath, {
						community_id: communityId,
						user_id: userId,
					}),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunityLoading(false);
	}).pipe(
		// same cleanup as other community operations: clear loading and set error
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
