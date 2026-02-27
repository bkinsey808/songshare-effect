import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityEventAddPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

export default function addEventToCommunity(
	communityId: string,
	eventId: string,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addEventToCommunityGen($) {
		const { setCommunityLoading, setCommunityError } = get();
		setCommunityLoading(true);
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () =>
					postJson(apiCommunityEventAddPath, {
						community_id: communityId,
						event_id: eventId,
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
