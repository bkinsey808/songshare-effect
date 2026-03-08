import { Effect } from "effect";

import getJson from "@/shared/fetch/getJson";
import { apiCommunityLibraryPath } from "@/shared/paths";

import type { CommunityEntry } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Retrieves the membership library for the currently authenticated user.
 *
 * Side‑effects include setting `isCommunityLoading`/`communityError` on the
 * provided slice during the request.  On success the resulting entries are
 * written back to the slice via `setCommunities`.
 *
 * @param get - callback returning the community slice helpers
 * @returns effect that yields the array of communities or fails with an error
 */
export default function fetchCommunityLibrary(
	get: () => CommunitySlice,
): Effect.Effect<readonly CommunityEntry[], Error> {
	return Effect.gen(function* fetchCommunityLibraryGen($) {
		const { setCommunities, setCommunityLoading, setCommunityError } = get();

		setCommunityLoading(true);
		setCommunityError(undefined);

		const communities = yield* $(
			Effect.tryPromise({
				try: () => getJson<readonly CommunityEntry[]>(apiCommunityLibraryPath),
				catch: (err) =>
					new Error(err instanceof Error ? err.message : "Failed to fetch community library"),
			}),
		);

		setCommunities(communities);
		setCommunityLoading(false);
		return communities;
	}).pipe(
		// On failure: clear loading, set error state, and log. Error still propagates.
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				const message = err instanceof Error ? err.message : String(err);
				setCommunityLoading(false);
				setCommunityError(message);
				console.error("[fetchCommunityLibrary] Error fetching community library:", message);
			}),
		),
		// Like `finally`: always clears loading on success, failure, or interruption.
		Effect.ensuring(
			Effect.sync(() => {
				const { setCommunityLoading } = get();
				setCommunityLoading(false);
			}),
		),
	);
}
