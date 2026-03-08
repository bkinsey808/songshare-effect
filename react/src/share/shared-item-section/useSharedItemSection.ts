import { Effect } from "effect";
import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import type { SharedItem, ShareStatus } from "@/react/share/slice/share-types";

type StatusFilter = "all" | ShareStatus;

export type UseSharedItemSectionReturn = {
	currentUserId: string | null | undefined;
	activeTab: "received" | "sent";
	setActiveTab: (tab: "received" | "sent") => void;
	statusFilter: StatusFilter;
	setStatusFilter: (filter: StatusFilter) => void;
	isLoading: boolean;
	filteredShares: SharedItem[];
	shareError: string | null | undefined;
	loadingShareId: string | null | undefined;
	handleAcceptShare: (shareId: string) => Promise<void>;
	handleRejectShare: (shareId: string) => Promise<void>;
};

/**
 * Encapsulates state, effects, and handlers for the shared items section.
 *
 * @returns State and handlers for the shared items dashboard UI
 */
export default function useSharedItemSection(): UseSharedItemSectionReturn {
	const currentUserId = useCurrentUserId();

	const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
	const [isLoading, setIsLoading] = useState(false);

	const receivedShares = useAppStore((state) => state.receivedShares);
	const sentShares = useAppStore((state) => state.sentShares);
	const shareError = useAppStore((state) => state.shareError);
	const loadingShareId = useAppStore((state) => state.loadingShareId);
	const fetchShares = useAppStore((state) => state.fetchShares);
	const updateShareStatus = useAppStore((state) => state.updateShareStatus);
	const getReceivedSharesByStatus = useAppStore((state) => state.getReceivedSharesByStatus);
	const getSentSharesByStatus = useAppStore((state) => state.getSentSharesByStatus);
	const subscribeToReceivedShares = useAppStore((state) => state.subscribeToReceivedShares);
	const subscribeToSentShares = useAppStore((state) => state.subscribeToSentShares);

	function getFilteredShares(): SharedItem[] {
		const shares =
			activeTab === "received"
				? Object.values(receivedShares)
				: Object.values(sentShares);

		if (statusFilter === "all") {
			return shares;
		}

		return activeTab === "received"
			? getReceivedSharesByStatus(statusFilter)
			: getSentSharesByStatus(statusFilter);
	}

	const filteredShares = getFilteredShares();

	// Load shares when tab or status filter changes and user is signed in
	useEffect((): void | (() => void) => {
		if (currentUserId === null || currentUserId === undefined) {
			// oxlint-disable-next-line no-empty-function -- React effect expects cleanup; no-op when no subscription
			return;
		}

		async function loadShares(): Promise<void> {
			setIsLoading(true);

			const request: { view: typeof activeTab; status?: ShareStatus } = {
				view: activeTab,
			};

			if (statusFilter !== "all") {
				request.status = statusFilter;
			}

			try {
				await Effect.runPromise(fetchShares(request));
			} catch (error) {
				console.error("Failed to load shares:", error);
			}
			setIsLoading(false);
		}

		void loadShares();
		// oxlint-disable-next-line no-empty-function -- no cleanup needed for fetch; return fn for React 19 HMR stability
		return;
	}, [activeTab, statusFilter, currentUserId, fetchShares]);

	// Set up real-time subscriptions for received and sent shares when user is signed in
	useEffect((): void | (() => void) => {
		if (currentUserId === null || currentUserId === undefined) {
			// oxlint-disable-next-line no-empty-function -- React effect expects cleanup; no-op when no subscription
			return;
		}

		let receivedCleanup: (() => void) | undefined = undefined;
		let sentCleanup: (() => void) | undefined = undefined;

		async function setupSubscriptions(): Promise<void> {
			if (currentUserId === null || currentUserId === undefined) {
				return;
			}

			try {
				receivedCleanup = await Effect.runPromise(
					subscribeToReceivedShares(currentUserId),
				);
				sentCleanup = await Effect.runPromise(
					subscribeToSentShares(currentUserId),
				);
			} catch (error) {
				console.error("Failed to set up share subscriptions:", error);
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
					status: "accepted",
				}),
			);
		} catch (error) {
			console.error("Failed to accept share:", error);
		}
	}

	async function handleRejectShare(shareId: string): Promise<void> {
		try {
			await Effect.runPromise(
				updateShareStatus({
					share_id: shareId,
					status: "rejected",
				}),
			);
		} catch (error) {
			console.error("Failed to reject share:", error);
		}
	}

	return {
		currentUserId,
		activeTab,
		setActiveTab,
		statusFilter,
		setStatusFilter,
		isLoading,
		filteredShares,
		shareError,
		loadingShareId,
		handleAcceptShare,
		handleRejectShare,
	};
}
