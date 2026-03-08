import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

// Import effects (will be created later)
import createShareFn from "../create/createShareEffect";
import fetchSharesFn from "../create/fetchSharesEffect";
import updateShareStatusFn from "../effects/updateShareStatusEffect";
import subscribeToReceivedSharesFn from "../subscribe/subscribeToReceivedShares";
import subscribeToSentSharesFn from "../subscribe/subscribeToSentShares";
import type {
	ShareCreateRequest,
	SharedItem,
	ShareListRequest,
	ShareState,
	ShareStatus,
	ShareUpdateStatusRequest,
} from "./share-types";
import type { ShareSlice } from "./ShareSlice.type";

const initialState: ShareState = {
	receivedShares: {} as Record<string, SharedItem>,
	sentShares: {} as Record<string, SharedItem>,
	isSharesLoading: false,
	shareError: undefined,
	loadingShareId: undefined,
};

/**
 * Factory that creates the Zustand slice for share state and actions.
 * The returned slice exposes Effects for creating, updating, fetching, and subscribing
 * to shares, as well as local setters used by those Effects.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `ShareSlice`.
 */
export default function createShareSlice(
	set: Set<ShareSlice>,
	get: Get<ShareSlice>,
	api: Api<ShareSlice>,
): ShareSlice {
	void api;
	sliceResetFns.add(() => {
		const { shareUnsubscribe } = get();
		if (shareUnsubscribe) {
			shareUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		// Effect-based actions
		createShare: (request: Readonly<ShareCreateRequest>) => createShareFn(request, get),
		updateShareStatus: (request: Readonly<ShareUpdateStatusRequest>) =>
			updateShareStatusFn(request, get),
		fetchShares: (request: Readonly<ShareListRequest>) => fetchSharesFn(request, get),
		subscribeToReceivedShares: (currentUserId: string): Effect.Effect<() => void, Error> =>
			subscribeToReceivedSharesFn(get, currentUserId),
		subscribeToSentShares: (currentUserId: string): Effect.Effect<() => void, Error> =>
			subscribeToSentSharesFn(get, currentUserId),

		// Helper methods
		isInReceivedShares: (shareId: string) => {
			const { receivedShares } = get();
			return shareId in receivedShares;
		},
		isInSentShares: (shareId: string) => {
			const { sentShares } = get();
			return shareId in sentShares;
		},
		getReceivedShareIds: () => {
			const { receivedShares } = get();
			return Object.keys(receivedShares);
		},
		getSentShareIds: () => {
			const { sentShares } = get();
			return Object.keys(sentShares);
		},
		getReceivedSharesByStatus: (status: ShareStatus) => {
			const { receivedShares } = get();
			return Object.values(receivedShares).filter((share) => share.status === status);
		},
		getSentSharesByStatus: (status: ShareStatus) => {
			const { sentShares } = get();
			return Object.values(sentShares).filter((share) => share.status === status);
		},

		// Optimistic update methods
		updateShareStatusOptimistically: (shareId: string, status: ShareStatus) => {
			set((state) => {
				const updatedReceived = { ...state.receivedShares };
				const updatedSent = { ...state.sentShares };

				if (shareId in updatedReceived) {
					const existingShare = updatedReceived[shareId];
					if (existingShare !== undefined) {
						updatedReceived[shareId] = {
							...existingShare,
							status,
							updated_at: new Date().toISOString(),
						};
					}
				}

				if (shareId in updatedSent) {
					const existingShare = updatedSent[shareId];
					if (existingShare !== undefined) {
						updatedSent[shareId] = {
							...existingShare,
							status,
							updated_at: new Date().toISOString(),
						};
					}
				}

				return {
					receivedShares: updatedReceived,
					sentShares: updatedSent,
				};
			});
		},

		addShareOptimistically: (share: SharedItem) => {
			set((state) => ({
				receivedShares: {
					...state.receivedShares,
					[share.share_id]: share,
				},
			}));
		},

		removeShareOptimistically: (shareId: string) => {
			set((state) => {
				const newReceived = Object.fromEntries(
					Object.entries(state.receivedShares).filter(([id]) => id !== shareId),
				);
				const newSent = Object.fromEntries(
					Object.entries(state.sentShares).filter(([id]) => id !== shareId),
				);
				return {
					receivedShares: newReceived,
					sentShares: newSent,
				};
			});
		},

		// State setters
		setReceivedShares: (shares: ReadonlyDeep<Record<string, SharedItem>>) => {
			set({ receivedShares: shares });
		},

		setSentShares: (shares: ReadonlyDeep<Record<string, SharedItem>>) => {
			set({ sentShares: shares });
		},

		setSharesLoading: (loading: boolean) => {
			set({ isSharesLoading: loading });
		},

		setShareError: (error: string | undefined) => {
			set({ shareError: error });
		},

		setLoadingShareId: (shareId: string | null | undefined) => {
			set({ loadingShareId: shareId });
		},

		addReceivedShare: (share: SharedItem) => {
			set((state) => ({
				receivedShares: {
					...state.receivedShares,
					[share.share_id]: share,
				},
			}));
		},

		addSentShare: (share: SharedItem) => {
			set((state) => ({
				sentShares: {
					...state.sentShares,
					[share.share_id]: share,
				},
			}));
		},

		updateReceivedShare: (share: SharedItem) => {
			set((state) => ({
				receivedShares: {
					...state.receivedShares,
					[share.share_id]: share,
				},
			}));
		},

		updateSentShare: (share: SharedItem) => {
			set((state) => ({
				sentShares: {
					...state.sentShares,
					[share.share_id]: share,
				},
			}));
		},

		removeReceivedShare: (shareId: string) => {
			set((state) => {
				const newShares = Object.fromEntries(
					Object.entries(state.receivedShares).filter(([id]) => id !== shareId),
				);
				return { receivedShares: newShares };
			});
		},

		removeSentShare: (shareId: string) => {
			set((state) => {
				const newShares = Object.fromEntries(
					Object.entries(state.sentShares).filter(([id]) => id !== shareId),
				);
				return { sentShares: newShares };
			});
		},
	};
}
