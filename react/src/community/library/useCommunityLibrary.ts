import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

import type { CommunityEntry } from "../community-types";

type UseCommunityLibraryReturn = {
	readonly communities: readonly CommunityEntry[];
	readonly isCommunityLoading: boolean;
	readonly communityError: string | undefined;
	readonly onCommunityClick: (slug: string) => void;
};

// placeholder click handler exposed so callers can wire up navigation if
// desired; there is no default action because routing lives in the UI layer.
function onCommunityClick(slug: string): void {
	// Navigation logic will be handled by the component or a helper
	void slug;
}

/**
 * Hook that fetches the list of communities the current user belongs to.
 *
 * Automatically triggers a fetch on mount and exposes loading/error state
 * along with an inert navigation callback (`onCommunityClick`) that callers
 * can wire up if desired.
 *
 * @returns data and status for the community library
 */
function useCommunityLibrary(): UseCommunityLibraryReturn {
	const fetchCommunityLibrary = useAppStore((state) => state.fetchCommunityLibrary);
	const communities = useAppStore((state) => state.communities);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);

	// Fetch the community library when the component mounts
	useEffect(() => {
		void Effect.runPromise(fetchCommunityLibrary());
	}, [fetchCommunityLibrary]);

	return {
		communities,
		isCommunityLoading,
		communityError,
		onCommunityClick,
	};
}

export type { UseCommunityLibraryReturn };
export default useCommunityLibrary;
