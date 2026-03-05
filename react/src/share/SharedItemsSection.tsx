import { useEffect, useState } from "react";
import { Effect } from "effect";
import { Link } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import ShareIcon from "@/react/lib/design-system/icons/ShareIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import type { SharedItem, ShareStatus } from "./slice/share-types";
import { getItemLink, getItemIcon, getStatusColor } from "./utils/shareItemUtils";

type StatusFilter = 'all' | ShareStatus;

const FIRST_CHAR_INDEX = 0;
const SECOND_CHAR_INDEX = 1;
const EMPTY_LENGTH = 0;


/**
 * Renders shared items dashboard with tabs for received/sent shares
 * and status filtering (pending, accepted, rejected).
 *
 * Each share shows the item name, type, sender/recipient, and action buttons.
 * For received shares: "Accept" / "Decline" buttons for pending items.
 * For sent shares: status display only.
 *
 * @returns React element for the shared items section
 */
export default function SharedItemsSection(): ReactElement | null {
	const currentUserId = useCurrentUserId();
	
	const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
	const [isLoading, setIsLoading] = useState(false);

	const { t } = useLocale();
	
	const {
		receivedShares,
		sentShares,
		shareError,
		loadingShareId,
		fetchShares,
		updateShareStatus,
		getReceivedSharesByStatus,
		getSentSharesByStatus,
		subscribeToReceivedShares,
		subscribeToSentShares,
	} = appStore();

	// Get filtered shares based on active tab and status
	function getFilteredShares(): SharedItem[] {
		const shares = activeTab === 'received' 
			? Object.values(receivedShares)
			: Object.values(sentShares);
			
		if (statusFilter === 'all') {
			return shares;
		}
		
		return activeTab === 'received'
			? getReceivedSharesByStatus(statusFilter)
			: getSentSharesByStatus(statusFilter);
	}

	const filteredShares = getFilteredShares();

	// Load shares when component mounts or tab changes
	useEffect(() => {
		if (currentUserId === null || currentUserId === undefined) {
			return;
		}

		async function loadShares(): Promise<void> {
			setIsLoading(true);
			
			const request: { view: typeof activeTab; status?: ShareStatus } = {
				view: activeTab,
			};
			
			if (statusFilter !== 'all') {
				request.status = statusFilter;
			}
			
			try {
				await Effect.runPromise(fetchShares(request));
			} catch (error) {
				console.error('Failed to load shares:', error);
			}
			setIsLoading(false);
		}

		void loadShares();
	}, [activeTab, statusFilter, currentUserId, fetchShares]);

	// Set up real-time subscriptions
	useEffect(() => {
		if (currentUserId === null || currentUserId === undefined) {
			return;
		}

		let receivedCleanup: (() => void) | undefined = undefined;
		let sentCleanup: (() => void) | undefined = undefined;

		async function setupSubscriptions(): Promise<void> {
			if (currentUserId === null || currentUserId === undefined) {
				return;
			}
			
			try {
				receivedCleanup = await Effect.runPromise(subscribeToReceivedShares(currentUserId));
				sentCleanup = await Effect.runPromise(subscribeToSentShares(currentUserId));
			} catch (error) {
				console.error('Failed to set up share subscriptions:', error);
			}
		}

		void setupSubscriptions();

		return (): void => {
			receivedCleanup?.();
			sentCleanup?.();
		};
	}, [currentUserId, subscribeToReceivedShares, subscribeToSentShares]);

	async function handleAcceptShare(shareId: string): Promise<void> {
		try {
			await Effect.runPromise(
				updateShareStatus({
					share_id: shareId,
					status: 'accepted',
				})
			);
		} catch (error) {
			console.error('Failed to accept share:', error);
		}
	}

	async function handleRejectShare(shareId: string): Promise<void> {
		try {
			await Effect.runPromise(
				updateShareStatus({
					share_id: shareId,
					status: 'rejected',
				})
			);
		} catch (error) {
			console.error('Failed to reject share:', error);
		}
	}



	// Don't show section if user is not signed in
	if (currentUserId === null || currentUserId === undefined) {
		return undefined;
	}

	return (
		<div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<ShareIcon className="size-5" />
					{t("pages.dashboard.sharedItems", "Shared Items")}
				</h3>
			</div>

			{/* Tab Navigation */}
			<div className="flex gap-1 mb-4 p-1 bg-gray-700 rounded-lg">
				<button
					type="button"
					onClick={() => {
						setActiveTab('received');
					}}
					className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
						activeTab === 'received'
							? 'bg-gray-600 text-white'
							: 'text-gray-300 hover:text-white hover:bg-gray-600/50'
					}`}
				>
					Received
				</button>
				<button
					type="button"
					onClick={() => {
						setActiveTab('sent');
					}}
					className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
						activeTab === 'sent'
							? 'bg-gray-600 text-white'
							: 'text-gray-300 hover:text-white hover:bg-gray-600/50'
					}`}
				>
					Sent
				</button>
			</div>

			{/* Status Filter */}
			<div className="flex gap-2 mb-4 overflow-x-auto">
				{(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
					<button
						key={status}
						type="button"
						onClick={() => {
							setStatusFilter(status);
						}}
						className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
							statusFilter === status
								? 'bg-blue-600 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
					>
						{status === 'all' ? 'All' : status.charAt(FIRST_CHAR_INDEX).toUpperCase() + status.slice(SECOND_CHAR_INDEX)}
					</button>
				))}
			</div>

			{/* Error Display */}
			{(shareError !== null && shareError !== undefined) && (
				<div className="mb-4 rounded bg-red-900/50 p-2 text-sm text-red-200 border border-red-700">
					{shareError}
				</div>
			)}

			{/* Loading State */}
			{isLoading && (
				<div className="text-center py-4">
					<p className="text-gray-400">Loading shares...</p>
				</div>
			)}

			{/* Shares List */}
			<div className="space-y-3">
				{filteredShares.map((share) => {
					const isLoadingThis = loadingShareId === share.share_id;
					const itemLink = getItemLink(share);
					
					return (
						<div
							key={share.share_id}
							className="flex items-center justify-between gap-4 rounded bg-gray-700/50 p-3"
						>
							<div className="flex items-center gap-3 min-w-0 flex-1">
								<div className="text-lg" aria-hidden>
									{getItemIcon(share.shared_item_type)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 mb-1">
										{(itemLink !== null && itemLink !== undefined) ? (
											<Link
												to={itemLink}
												className="font-medium text-white hover:text-blue-400 transition-colors truncate"
											>
												{share.shared_item_name}
											</Link>
										) : (
											<p className="font-medium text-white truncate">
												{share.shared_item_name}
											</p>
										)}
										<span className={`text-xs font-medium ${getStatusColor(share.status)}`}>
											{share.status}
										</span>
									</div>
									<div className="text-xs text-gray-400">
										{activeTab === 'received' ? (
											<>From: {share.sender_username ?? share.sender_user_id}</>
										) : (
											<>To: {share.recipient_username ?? share.recipient_user_id}</>
										)}
										{(share.message !== null && share.message !== undefined) && (
											<>
												{' • '}
												<span className="italic">&ldquo;{share.message}&rdquo;</span>
											</>
										)}
									</div>
								</div>
							</div>

							{/* Actions */}
							{activeTab === 'received' && share.status === 'pending' && (
								<div className="flex gap-2 shrink-0">
									<Button
										variant="primary"
										size="compact"
										onClick={() => {
											void handleAcceptShare(share.share_id);
										}}
										disabled={isLoadingThis}
									>
										{isLoadingThis ? "..." : "Accept"}
									</Button>
									<Button
										variant="outlineDanger"
										size="compact"
										onClick={() => {
											void handleRejectShare(share.share_id);
										}}
										disabled={isLoadingThis}
									>
										{isLoadingThis ? "..." : "Decline"}
									</Button>
								</div>
							)}
						</div>
					);
				})}

				{/* Empty State */}
				{!isLoading && filteredShares.length === EMPTY_LENGTH && (
					<div className="text-center py-8">
						<div className="text-4xl mb-2" aria-hidden>
							{activeTab === 'received' ? '📥' : '📤'}
						</div>
						<p className="text-gray-400">
							{activeTab === 'received' 
								? 'No received shares found'
								: 'No sent shares found'
							}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}