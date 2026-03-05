import ShareIcon from "@/react/lib/design-system/icons/ShareIcon";
import { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import type { SharedItemType, SharedItem } from "./slice/share-types";

const EMPTY_LENGTH = 0;

function getStatusColor(status: string): string {
	switch (status) {
		case 'accepted': {
			return 'text-green-400';
		}
		case 'rejected': {
			return 'text-red-400';
		}
		case 'pending': {
			return 'text-yellow-400';
		}
		default: {
			return 'text-gray-400';
		}
	}
}

function getStatusIcon(status: string): string {
	switch (status) {
		case 'accepted': {
			return '✓';
		}
		case 'rejected': {
			return '✗';
		}
		case 'pending': {
			return '⏳';
		}
		default: {
			return '?';
		}
	}
}

type SharedUsersSectionProps = {
	itemType: SharedItemType;
	itemId: string;
	itemName: string;
};

/**
 * Shows a list of users this item has been shared with and their response status.
 * Only shows for the owner/sender of the shares.
 */
export default function SharedUsersSection({
	itemType,
	itemId,
	itemName: _itemName,
}: SharedUsersSectionProps): ReactElement | null {
	const currentUserId = useCurrentUserId();
	const sentShares = appStore((state) => state.sentShares);
	const isSharesLoading = appStore((state) => state.isSharesLoading);

	// Subscription is set up by the page (e.g. SongView via useShareSubscription)
	// Get shares for this specific item - React Compiler will optimize this
	const itemShares: SharedItem[] = Object.values(sentShares).filter(share => 
		share.shared_item_type === itemType && 
		share.shared_item_id === itemId
	);

	// Don't show if user is not signed in
	if (currentUserId === null || currentUserId === undefined) {
		return undefined;
	}

	return (
		<div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
			<div className="flex items-center gap-2 mb-4">
				<ShareIcon className="size-5" />
				<h3 className="text-lg font-semibold text-white">
					Shared with ({itemShares.length})
				</h3>
			</div>

			{isSharesLoading && (
				<p className="text-sm text-gray-400 py-4">Loading shares...</p>
			)}

			{!isSharesLoading && itemShares.length === EMPTY_LENGTH && (
				<p className="text-sm text-gray-400 py-4">
					You have not shared this with anyone yet.
				</p>
			)}

			{!isSharesLoading && itemShares.length > EMPTY_LENGTH && (
			<div className="space-y-2">
				{itemShares.map((share) => (
					<div
						key={share.share_id}
						className="flex items-center justify-between gap-4 rounded bg-gray-700/50 p-3"
					>
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<div className="min-w-0 flex-1">
								<p className="font-medium text-white truncate">
									{share.recipient_username ?? share.recipient_user_id}
								</p>
								{(share.message !== null && share.message !== undefined && share.message !== "") && (
									<p className="text-xs text-gray-400 italic truncate">
										&ldquo;{share.message}&rdquo;
									</p>
								)}
								<p className="text-xs text-gray-500">
									Shared {new Date(share.created_at).toLocaleDateString()}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							<span className="text-lg" aria-hidden="true">
								{getStatusIcon(share.status)}
							</span>
							<span className={`text-sm font-medium capitalize ${getStatusColor(share.status)}`}>
								{share.status}
							</span>
						</div>
					</div>
				))}
			</div>
			)}
		</div>
	);
}