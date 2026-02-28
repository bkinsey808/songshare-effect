import { Effect } from "effect";

import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiCommunitySavePath } from "@/shared/paths";

import type { CommunityEntry, SaveCommunityRequest } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Persists a community create/edit request and returns the updated entry.
 *
 * Updates `isCommunitySaving` and `communityError` on the slice around the
 * HTTP call.
 *
 * @param request - payload to save (new or existing community)
 * @param get - accessor for the community slice helpers
 * @returns effect yielding the saved `CommunityEntry`
 */
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
		// saving logic mirrors the loading/error pattern of other helpers but
		// affects `isCommunitySaving` instead of `isCommunityLoading`.
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunitySaving, setCommunityError } = get();
				setCommunitySaving(false);
				setCommunityError(err.message);
			}),
		),
	);
}
