import { Effect } from "effect";
import { useEffect } from "react";

type LoadCommunityBySlug = (
	slug: string,
	options?: { silent?: boolean },
) => Effect.Effect<unknown, Error>;

/**
 * Loads the current community whenever the route slug changes.
 *
 * @param communitySlug - route slug for the current community
 * @param loadCommunityBySlug - store action that fetches the community
 */
export default function useLoadCommunityBySlug(
	communitySlug: string | undefined,
	loadCommunityBySlug: LoadCommunityBySlug,
): void {
	// Refresh community state whenever navigation points at a different slug.
	useEffect(() => {
		if (communitySlug !== undefined && communitySlug !== "") {
			void Effect.runPromise(loadCommunityBySlug(communitySlug));
		}
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [communitySlug, loadCommunityBySlug]);
}
