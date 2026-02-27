import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

export default function joinCommunity(
	communityId: string,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* joinCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();

		setCommunityLoading(true);
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () => postJson(apiCommunityUserJoinPath, { community_id: communityId }),
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
