import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

import type { CommunityEntry } from "../community-types";

type UseCommunityLibraryReturn = {
	readonly communities: readonly CommunityEntry[];
	readonly isCommunityLoading: boolean;
	readonly communityError: string | undefined;
};

/**
 * Hook that fetches the list of communities the current user belongs to.
 *
 * Automatically triggers a fetch on mount and exposes loading/error state.
 *
 * @returns communities - the user's communities from the store
 * @returns isCommunityLoading - true while community-related requests are active
 * @returns communityError - error message when fetching the community data fails
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
	};
}

export default useCommunityLibrary;
