import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserKickPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

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
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
