import { Effect } from "effect";
import { useState, useTransition } from "react";

import useAppStore, { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { ShareCreateRequest, SharedItemType } from "@/react/share/slice/share-types";

type UseShareButtonParams = Readonly<{
	itemType: SharedItemType;
	itemId: string;
	itemName: string;
	onShareSuccess?: () => void;
}>;

type UseShareButtonResult = Readonly<{
	selectedUserId: string | undefined;
	isSharing: boolean;
	isPending: boolean;
	excludeUserIds: string[];
	handleUserSelect: (userId: string) => void;
}>;

type SentShare = {
	shared_item_type: string;
	shared_item_id: string;
	status: string;
	recipient_user_id: string;
};

export default function useShareButton({
	itemType,
	itemId,
	itemName,
	onShareSuccess,
}: UseShareButtonParams): UseShareButtonResult {
	const currentUserId = useCurrentUserId();
	const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
	const [isSharing, setIsSharing] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Subscribe reactively so the exclusion list updates when fetchShares completes
	// (e.g. stale persisted "pending" shares are replaced by the current server state).
	const sentShares = useAppStore((state) => state.sentShares);
	const baseExcludeIds =
		currentUserId !== undefined && currentUserId !== null ? [currentUserId] : [];
	const sharedUserIds = Object.values(sentShares)
		.filter(
			(share: SentShare) =>
				share.shared_item_type === itemType &&
				share.shared_item_id === itemId &&
				// Only exclude users with a pending (awaiting response) share; allow
				// re-sharing after a rejection or accepted share becomes outdated.
				share.status === "pending",
		)
		.map((share: SentShare) => share.recipient_user_id);
	const excludeUserIds = [...baseExcludeIds, ...sharedUserIds];

	function handleUserSelect(userId: string): void {
		if (currentUserId === null || currentUserId === undefined) {
			console.warn("Cannot share: user not signed in");
			return;
		}

		startTransition(() => {
			setSelectedUserId(userId);
			setIsSharing(true);
		});

		const shareRequest: ShareCreateRequest = {
			shared_item_type: itemType,
			shared_item_id: itemId,
			shared_item_name: itemName,
			recipient_user_id: userId,
		};

		const IMMEDIATE_TIMEOUT = 0;
		setTimeout(() => {
			void (async (): Promise<void> => {
				try {
					const { createShare, fetchShares } = appStore.getState();

					await Effect.runPromise(createShare(shareRequest));
					await Effect.runPromise(fetchShares({ view: "sent" }));

					if (onShareSuccess !== undefined) {
						onShareSuccess();
					}

					startTransition(() => {
						setIsSharing(false);
						setSelectedUserId(undefined);
					});
				} catch (error) {
					console.error("Failed to share item:", error);
					startTransition(() => {
						setIsSharing(false);
					});
				}
			})();
		}, IMMEDIATE_TIMEOUT);
	}

	return {
		selectedUserId,
		isSharing,
		isPending,
		excludeUserIds,
		handleUserSelect,
	};
}
