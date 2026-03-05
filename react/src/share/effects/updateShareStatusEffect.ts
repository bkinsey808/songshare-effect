import { Effect } from "effect";

import type { Get } from "@/react/app-store/app-store-types";
import type { ShareSlice } from "@/react/share/slice/ShareSlice.type";
import type { ShareUpdateStatusRequest } from "@/react/share/slice/share-types";

import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareUpdateStatusPath } from "@/shared/paths";

/**
 * Effect for updating share status (accept/reject).
 *
 * This effect:
 * 1. Optimistically updates the share status
 * 2. Sets loading state for the specific share
 * 3. Makes API call to update status
 * 4. Reverts optimistic update on failure
 *
 * @param request - The share status update request
 * @param get - Function to get current slice state
 * @returns Effect that resolves when status is updated
 */
export default function updateShareStatusEffect(
	request: Readonly<ShareUpdateStatusRequest>,
	get: Get<ShareSlice>,
): Effect.Effect<void, Error> {
	return Effect.gen(function* updateShareStatusGen($) {
		const {
			updateShareStatusOptimistically,
			setShareError,
			setLoadingShareId,
		} = get();

		// Set loading state for this specific share
		setLoadingShareId(request.share_id);
		setShareError(undefined);

		// Optimistic update - immediately show the new status
		const originalStatus = get().receivedShares[request.share_id]?.status || 'pending';
		updateShareStatusOptimistically(request.share_id, request.status);

		try {
			// Make API call
			yield* $(
				Effect.tryPromise({
					try: () =>
						postJsonWithResult<{ success: boolean }>(apiShareUpdateStatusPath, request),
					catch: (error) => new Error(`Failed to update share status: ${String(error)}`),
				}),
			);

			// Success - the optimistic update was correct
			// Real-time subscription will sync any additional changes

		} catch (error) {
			// Revert optimistic update on error
			updateShareStatusOptimistically(request.share_id, originalStatus);
			
			// Handle error
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			setShareError(errorMessage);
			throw error;
		} finally {
			// Clear loading state
			setLoadingShareId(undefined);
		}
	});
}