import type { Effect } from "effect";

import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type {
	ShareCreateRequest,
	ShareListRequest,
	SharedItem,
	ShareSliceBase,
	ShareState,
	ShareStatus,
	ShareUpdateStatusRequest,
} from "./share-types";

export type ShareSlice = ShareState &
	ShareSliceBase & {
		createShare: (
			request: Readonly<ShareCreateRequest>,
		) => Effect.Effect<{ shareId: string }, Error>;
		updateShareStatus: (request: Readonly<ShareUpdateStatusRequest>) => Effect.Effect<void, Error>;
		fetchShares: (request: Readonly<ShareListRequest>) => Effect.Effect<void, Error>;
		subscribeToReceivedShares: (currentUserId: string) => Effect.Effect<() => void, Error>;
		subscribeToSentShares: (currentUserId: string) => Effect.Effect<() => void, Error>;
		shareUnsubscribe?: () => void;

		// Optimistic update methods
		updateShareStatusOptimistically: (shareId: string, status: ShareStatus) => void;
		addShareOptimistically: (share: SharedItem) => void;
		removeShareOptimistically: (shareId: string) => void;

		// State setters
		setReceivedShares: (shares: ReadonlyDeep<Record<string, SharedItem>>) => void;
		setSentShares: (shares: ReadonlyDeep<Record<string, SharedItem>>) => void;
		setSharesLoading: (loading: boolean) => void;
		setShareError: (error: string | undefined) => void;
		setLoadingShareId: (shareId: string | null | undefined) => void;
		addReceivedShare: (share: SharedItem) => void;
		addSentShare: (share: SharedItem) => void;
		updateReceivedShare: (share: SharedItem) => void;
		updateSentShare: (share: SharedItem) => void;
		removeReceivedShare: (shareId: string) => void;
		removeSentShare: (shareId: string) => void;
	};
