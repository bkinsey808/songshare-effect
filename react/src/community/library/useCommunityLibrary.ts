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

function onCommunityClick(slug: string): void {
	// Navigation logic will be handled by the component or a helper
	void slug;
}

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
