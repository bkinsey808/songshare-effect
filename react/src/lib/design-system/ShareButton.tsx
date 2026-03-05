import { useState, useTransition } from "react";
import { Effect } from "effect";
import Button from "@/react/lib/design-system/Button";
import ShareIcon from "@/react/lib/design-system/icons/ShareIcon";
import { NativePopover } from "@/react/lib/design-system/popover/NativePopover";
import UserSearchInput from "@/react/user-search-input/UserSearchInput";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import { appStore } from "@/react/app-store/useAppStore";

import type { SharedItemType, ShareCreateRequest } from "@/react/share/slice/share-types";

type ShareButtonProps = {
	itemType: SharedItemType;
	itemId: string;
	itemName: string;
	variant?: 'primary' | 'outlinePrimary';
	size?: 'default' | 'compact';
	disabled?: boolean;
	className?: string;
	"data-testid"?: string;
};

/**
 * Reusable share button component with inline user picker.
 *
 * This component provides a consistent way to add sharing functionality
 * to any item in the application (songs, playlists, events, communities, users).
 * When clicked, it shows an inline popover with a user search input.
 *
 * @param itemType - Type of item being shared
 * @param itemId - Unique identifier of the item
 * @param itemName - Display name of the item
 * @param variant - Visual variant of the button (defaults to 'outlinePrimary')
 * @param size - Visual size (defaults to 'compact')
 * @param disabled - When true, the button is disabled
 * @param className - Optional extra class names to apply
 * @param data-testid - Optional test id attribute used in tests
 * @returns A styled share button React element with inline user picker
 */
export default function ShareButton({
	itemType,
	itemId,
	itemName,
	variant = "outlinePrimary",
	size = "compact",
	disabled = false,
	className = "",
	"data-testid": dataTestId,
}: ShareButtonProps): ReactElement {
	// Avoid store hook completely during render - get it only when needed
	const currentUserId = useCurrentUserId();
	
	const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
	const [isSharing, setIsSharing] = useState(false);
	const [isPending, startTransition] = useTransition();
	
	// Get users who have already been shared with for this item
	function getSharedUserIds(): string[] {
		const state = appStore.getState();
		const sentShares = state?.sentShares ?? {};
		return Object.values(sentShares)
			.filter(share => 
				share.shared_item_type === itemType && 
				share.shared_item_id === itemId
			)
			.map(share => share.recipient_user_id);
	}
	
	
	// Create excludeUserIds array - exclude current user and already shared users
	const baseExcludeIds = currentUserId !== undefined && currentUserId !== null 
		? [currentUserId] 
		: [];
	const sharedUserIds = getSharedUserIds();
	const excludeUserIds = [...baseExcludeIds, ...sharedUserIds];

	// Handler that gets store function only when needed to avoid hook issues
	function handleUserSelect(userId: string): void {
		if (currentUserId === null || currentUserId === undefined) {
			console.warn("Cannot share: user not signed in");
			return;
		}

		
		// Update state immediately for UI feedback
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

		// Get the store function only when we need it, not during render
		const IMMEDIATE_TIMEOUT = 0;
		setTimeout(() => {
			// Get the createShare function from the store state (not the hook)
			void (async (): Promise<void> => {
				try {
					const { createShare, fetchShares } = appStore.getState();
					
					await Effect.runPromise(createShare(shareRequest));
					
					// Refresh sent shares so SharedUsersSection shows the new share
					await Effect.runPromise(fetchShares({ view: 'sent' }));
					
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

	const shareContent = (
		<div className="w-80">
			<div className="mb-3">
				<p className="text-sm text-gray-300 mb-1">Share {itemType}:</p>
				<p className="font-medium text-white text-sm truncate">{itemName}</p>
			</div>
			
			<UserSearchInput
				activeUserId={selectedUserId}
				onSelect={handleUserSelect}
				disabled={isSharing || isPending}
				label="Share with user"
				excludeUserIds={excludeUserIds}
			/>
			
			{(isSharing || isPending) && (
				<p className="text-sm text-blue-400 mt-2">Sharing...</p>
			)}
		</div>
	);

	return (
		<NativePopover
			content={shareContent}
			preferredPlacement="bottom"
			trigger="click"
			allowOverflow
		>
			<Button
				variant={variant}
				size={size}
				icon={<ShareIcon className="size-4" />}
				disabled={disabled}
				className={className}
				{...(dataTestId !== null && dataTestId !== undefined && { "data-testid": dataTestId })}
			>
				Share
			</Button>
		</NativePopover>
	);
}