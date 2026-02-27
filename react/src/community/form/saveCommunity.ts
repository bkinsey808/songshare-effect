import { Effect } from "effect";

import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiCommunitySavePath } from "@/shared/paths";

import type { CommunityEntry, SaveCommunityRequest } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

export default function saveCommunity(
	request: Readonly<SaveCommunityRequest>,
	get: () => CommunitySlice,
): Effect.Effect<CommunityEntry, Error> {
	return Effect.gen(function* saveCommunityGen($) {
		const { setCommunitySaving, setCommunityError } = get();

		setCommunitySaving(true);
		setCommunityError(undefined);

		const result = yield* $(
			Effect.tryPromise({
				try: () => postJsonWithResult<CommunityEntry>(apiCommunitySavePath, request),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunitySaving(false);
		return result;
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunitySaving, setCommunityError } = get();
				setCommunitySaving(false);
				setCommunityError(err.message);
			}),
		),
	);
}
