import { Effect } from "effect";

import type { Get } from "@/react/app-store/app-store-types";
import type { ShareSlice } from "@/react/share/slice/ShareSlice.type";
import type { ShareListRequest, SharedItem } from "@/react/share/slice/share-types";
import isSharedItem from "@/react/share/guards/isSharedItem";
import isRecord from "@/shared/type-guards/isRecord";

import { apiShareListPath } from "@/shared/paths";

/** Unwrap API response - handles { shares } or { success, data: { shares } } */
function extractSharesFromResponse(value: unknown): SharedItem[] {
	if (!isRecord(value)) {
		return [];
	}
	const rawShares = value["shares"];
	if (Array.isArray(rawShares)) {
		return rawShares.filter((item): item is SharedItem => isSharedItem(item));
	}
	const { data } = value;
	if (isRecord(data)) {
		const nestedShares = data["shares"];
		return Array.isArray(nestedShares)
			? nestedShares.filter((item): item is SharedItem => isSharedItem(item))
			: [];
	}
	return [];
}

/**
 * Effect for fetching shares from the API.
 *
 * This effect:
 * 1. Sets loading state
 * 2. Makes API call to fetch shares
 * 3. Updates the appropriate share collection (sent/received)
 * 4. Handles errors appropriately
 *
 * @param request - The share list request (sent/received, filters)
 * @param get - Function to get current slice state
 * @returns Effect that resolves when shares are fetched
 */
export default function fetchSharesEffect(
	request: Readonly<ShareListRequest>,
	get: Get<ShareSlice>,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchSharesGen($) {
		const {
			setSharesLoading,
			setShareError,
			setReceivedShares,
			setSentShares,
		} = get();

		// Set loading state
		setSharesLoading(true);
		setShareError(undefined);

		try {
			// Build query parameters
			const params = new URLSearchParams({
				view: request.view,
			});
			
			if (request.status) {
				params.append('status', request.status);
			}
			
			if (request.item_type) {
				params.append('item_type', request.item_type);
			}

			// Make API call
			const response = yield* $(
				Effect.tryPromise({
					try: async () => {
						const url = `${apiShareListPath}?${params.toString()}`;
						const res = await fetch(url, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
							},
							credentials: 'include',
						});

						if (!res.ok) {
							throw new Error(`HTTP ${res.status}: ${res.statusText}`);
						}

						const jsonData: unknown = await res.json();
						return extractSharesFromResponse(jsonData);
					},
					catch: (error) => new Error(`Failed to fetch shares: ${String(error)}`),
				}),
			);

			// Convert array to record keyed by share_id
			const sharesRecord = response.reduce<Record<string, SharedItem>>(
				(acc, share) => {
					acc[share.share_id] = share;
					return acc;
				},
				{},
			);

			// Update the appropriate collection
			if (request.view === 'received') {
				setReceivedShares(sharesRecord);
			} else {
				setSentShares(sharesRecord);
			}

		} catch (error) {
			// Handle error
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			setShareError(errorMessage);
			throw error;
		} finally {
			// Clear loading state
			setSharesLoading(false);
		}
	});
}