import { Effect } from "effect";

import type { SharedItem, SharedItemType } from "@/react/share/slice/share-types";

/** Minimal ShareSlice interface for acceptPendingSharesForItem callers. */
export type ShareSliceForAccept = {
	getReceivedSharesByStatus: (status: "pending") => readonly SharedItem[];
	updateShareStatus: (req: { share_id: string; status: "accepted" }) => Effect.Effect<void, Error>;
};

/**
 * Accepts any pending received shares that match the given item.
 * Called after adding a song, playlist, event, or community to the user's library.
 *
 * Non-fatal: if accepting a share fails, we log and continue (the item is
 * already in the library; the share status is a secondary concern).
 *
 * @param itemType - shared_item_type (song, playlist, event, community)
 * @param itemId - shared_item_id (song_id, playlist_id, event_id, community_id)
 * @param get - Function to get share slice (or full app state with ShareSlice)
 */
export default function acceptPendingSharesForItem(
	itemType: SharedItemType,
	itemId: string,
	get: () => unknown,
): Effect.Effect<void, Error> {
	return Effect.gen(function* acceptPendingSharesForItemGen($) {
		// Caller may pass slice-only get (e.g. tests); runtime check guards access
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const slice = get() as Partial<ShareSliceForAccept>;
		const { getReceivedSharesByStatus, updateShareStatus } = slice;
		if (
			typeof getReceivedSharesByStatus !== "function" ||
			typeof updateShareStatus !== "function"
		) {
			// Caller passed a partial get (e.g. from tests with slice-only mocks) - no-op
			return;
		}
		const pending = getReceivedSharesByStatus("pending");
		const matching = pending.filter(
			(share) => share.shared_item_type === itemType && share.shared_item_id === itemId,
		);

		for (const share of matching) {
			yield* $(
				updateShareStatus({ share_id: share.share_id, status: "accepted" }).pipe(
					Effect.catchAll((err) =>
						Effect.sync(() => {
							console.warn(
								"[acceptPendingSharesForItem] Failed to accept share:",
								share.share_id,
								err,
							);
						}),
					),
				),
			);
		}
	});
}
