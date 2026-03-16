import Button from "@/react/lib/design-system/Button";
import ShareIcon from "@/react/lib/design-system/icons/ShareIcon";
import { NativePopover } from "@/react/lib/design-system/popover/NativePopover";
import type { SharedItemType } from "@/react/share/slice/share-types";
import UserSearchInput from "@/react/user-search-input/UserSearchInput";

import useShareButton from "./useShareButton";

type ShareButtonProps = {
	itemType: SharedItemType;
	itemId: string;
	itemName: string;
	variant?: "primary" | "outlinePrimary";
	size?: "default" | "compact";
	disabled?: boolean;
	className?: string;
	/** Called after a successful share. Use to refresh related data (e.g. community members). */
	onShareSuccess?: () => void;
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
	onShareSuccess,
	"data-testid": dataTestId,
}: ShareButtonProps): ReactElement {
	const { selectedUserId, isSharing, isPending, excludeUserIds, handleUserSelect } = useShareButton(
		{
			itemType,
			itemId,
			itemName,
			...(onShareSuccess !== undefined && { onShareSuccess }),
		},
	);

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

			{(isSharing || isPending) && <p className="text-sm text-blue-400 mt-2">Sharing...</p>}
		</div>
	);

	return (
		<NativePopover
			content={shareContent}
			preferredPlacement="bottom"
			trigger="click"
			allowOverflow
			triggerContainer="div"
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
