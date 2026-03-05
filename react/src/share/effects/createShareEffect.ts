import { Effect } from "effect";

import type { Get } from "@/react/app-store/app-store-types";
import type { ShareSlice } from "@/react/share/slice/ShareSlice.type";
import type { ShareCreateRequest } from "@/react/share/slice/share-types";

import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareCreatePath } from "@/shared/paths";

/**
 * Effect for creating a new share.
 *
 * This effect:
 * 1. Sets loading state
 * 2. Makes API call to create the share
 * 3. Updates state based on success/failure
 * 4. Provides optimistic UI updates
 *
 * @param request - The share creation request
 * @param get - Function to get current slice state
 * @returns Effect that resolves when share is created
 */
export default function createShareEffect(
	request: Readonly<ShareCreateRequest>,
	get: Get<ShareSlice>,
): Effect.Effect<{ shareId: string }, Error> {
	return Effect.gen(function* createShareGen($) {
		const {
			setSharesLoading,
			setShareError,
			setLoadingShareId,
			addSentShare,
		} = get();

		// Set loading state
		setSharesLoading(true);
		setShareError(undefined);

		try {
			// Make API call
			const { shareId } = yield* $(
				Effect.tryPromise({
					try: () =>
						postJsonWithResult<{ shareId: string }>(apiShareCreatePath, request),
					catch: (error) => new Error(`Failed to create share: ${String(error)}`),
				}),
			);

			// Optimistically add share so "Shared with" updates immediately.
			// fetchShares (called by ShareButton) will replace with full data (usernames, etc.).
			const optimisticShare = {
				share_id: shareId,
				sender_user_id: "", // Filled by fetchShares; not needed for display
				recipient_user_id: request.recipient_user_id,
				shared_item_type: request.shared_item_type,
				shared_item_id: request.shared_item_id,
				shared_item_name: request.shared_item_name,
				status: "pending" as const,
				message: request.message ?? undefined,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			addSentShare(optimisticShare);

			return { shareId };
		} catch (error) {
			// Handle error
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			setShareError(errorMessage);
			throw error;
		} finally {
			// Clear loading state
			setSharesLoading(false);
			setLoadingShareId(undefined);
		}
	});
}
