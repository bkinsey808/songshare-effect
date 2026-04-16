import { Effect } from "effect";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { communityEditPath, dashboardPath } from "@/shared/paths";

import type { CommunityEntry } from "../community-types";

type UseCommunityLibraryReturn = {
	readonly communities: readonly CommunityEntry[];
	readonly isCommunityLoading: boolean;
	readonly communityError: string | undefined;
	readonly onCreateCommunityClick: () => void;
};

/**
 * Hook that fetches the list of communities the current user belongs to.
 *
 * Automatically triggers a fetch on mount and exposes loading/error state.
 *
 * @returns An object containing community list, loading state, error, and action callbacks
 */
function useCommunityLibrary(): UseCommunityLibraryReturn {
	const navigate = useNavigate();
	const { lang } = useLocale();
	const fetchCommunityLibrary = useAppStore((state) => state.fetchCommunityLibrary);
	const communities = useAppStore((state) => state.communities);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);

	// Fetch the community library when the component mounts
	useEffect(() => {
		void Effect.runPromise(fetchCommunityLibrary());
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [fetchCommunityLibrary]);

	/**
	 * Navigate to the community creation page.
	 *
	 * @returns void
	 */
	function onCreateCommunityClick(): void {
		void navigate(buildPathWithLang(`/${dashboardPath}/${communityEditPath}`, lang));
	}

	return {
		communities,
		isCommunityLoading,
		communityError,
		onCreateCommunityClick,
	};
}

export default useCommunityLibrary;
