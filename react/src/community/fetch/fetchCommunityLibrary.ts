import { Effect } from "effect";

import getJson from "@/shared/fetch/getJson";
import { apiCommunityLibraryPath } from "@/shared/paths";

import type { CommunityEntry } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Fetch the list of communities where the current user is a member.
 */
export default function fetchCommunityLibrary(
	get: () => CommunitySlice,
): Effect.Effect<readonly CommunityEntry[], Error> {
	return Effect.gen(function* fetchCommunityLibraryGen($) {
		const { setCommunities, setCommunityLoading, setCommunityError } = get();

		setCommunityLoading(true);
		setCommunityError(undefined);

		try {
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
		} catch (error: unknown) {
			setCommunityLoading(false);
			const message = error instanceof Error ? error.message : String(error);
			setCommunityError(message);
			return yield* $(Effect.fail(new Error(message)));
		}
	});
}
