import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import type { SharedItem, SharedItemType } from "../slice/share-types";

export type UseSharedUsersSectionReturn = {
	currentUserId: string | null | undefined;
	itemShares: SharedItem[];
	isSharesLoading: boolean;
};

/**
 * Encapsulates state and derived data for the shared users section.
 * Filters sent shares by item type and id.
 *
 * @param itemType - The type of shared item (song, playlist, etc.)
 * @param itemId - The ID of the shared item
 * @returns State for the shared users section UI
 */
export default function useSharedUsersSection(
	itemType: SharedItemType,
	itemId: string,
): UseSharedUsersSectionReturn {
	const currentUserId = useCurrentUserId();
	const sentShares = useAppStore((state) => state.sentShares);
	const isSharesLoading = useAppStore((state) => state.isSharesLoading);

	// Subscription is set up by the page (e.g. SongView via useShareSubscription)
	// Get shares for this specific item - React Compiler will optimize this
	const itemShares = Object.values(sentShares).filter(
		(share: SharedItem) =>
			share.shared_item_type === itemType && share.shared_item_id === itemId,
	);

	return {
		currentUserId,
		itemShares,
		isSharesLoading,
	};
}
