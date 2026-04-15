import { Effect } from "effect";

import type { SharedItemType } from "@/react/share/slice/share-types";
import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareRejectByItemPath } from "@/shared/paths";

/**
 * Rejects any accepted received shares that match the given item.
 * Called after removing a song, playlist, event, or community from the user's library.
 *
 * Uses the API to find and reject matching shares server-side, so it works
 * regardless of whether the client has fetched the share list.
 *
 * Non-fatal: if the request fails, we log and continue (the item is
 * already removed; the share status is a secondary concern).
 *
 * @param itemType - shared_item_type (song, playlist, event, community)
 * @param itemId - shared_item_id (song_id, playlist_id, event_id, community_id)
 * @returns An Effect that resolves when the API call finishes (may log on error).
 */
export default function rejectAcceptedSharesForItem(
	itemType: SharedItemType,
	itemId: string,
): Effect.Effect<void, Error> {
	return Effect.gen(function* rejectAcceptedSharesForItemGen($) {
		yield* $(
			Effect.tryPromise({
				try: () =>
					postJsonWithResult<{ success: boolean; rejected_count: number }>(
						apiShareRejectByItemPath,
						{ shared_item_type: itemType, shared_item_id: itemId },
					),
				catch: (err) => new Error(String(err)),
			}).pipe(
				Effect.catchAll((err) =>
					Effect.sync(() => {
						console.warn(
							"[rejectAcceptedSharesForItem] Failed to reject shares for item:",
							itemType,
							itemId,
							err,
						);
					}),
				),
			),
		);
	});
}
