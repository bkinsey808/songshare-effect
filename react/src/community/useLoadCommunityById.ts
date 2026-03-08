import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

/**
 * Loads the current community when editing by community_id.
 *
 * Ensures the community is fetched when the edit page is visited directly
 * (e.g. via bookmark or from a list) so the form can populate and
 * hasUnsavedChanges tracking works correctly.
 */
export default function useLoadCommunityById(communityId: string | undefined): void {
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const fetchCommunityById = useAppStore((state) => state.fetchCommunityById);

	// Fetch community by ID when route has community_id but store has no matching community.
	useEffect(() => {
		if (
			communityId !== undefined &&
			communityId !== "" &&
			currentCommunity?.community_id !== communityId
		) {
			void Effect.runPromise(fetchCommunityById(communityId));
		}
	}, [communityId, currentCommunity?.community_id, fetchCommunityById]);
}
