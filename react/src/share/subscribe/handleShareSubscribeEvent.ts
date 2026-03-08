import { Effect } from "effect";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import normalizeRealtimePayload from "@/react/lib/supabase/subscription/normalizeRealtimePayload";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import isSharedItem from "../guards/isSharedItem";
import type { SharedItem } from "../slice/share-types";
import type { ShareSlice } from "../slice/ShareSlice.type";

type ShareEventContext = {
	get: () => ShareSlice;
	shareType: "sent" | "received";
};

/**
 * Processes realtime events for share subscriptions. Handles INSERT/UPDATE
 * by adding or updating the share entry, and DELETE by removing the entry
 * from the local slice. Non-realtime payloads are ignored.
 *
 * @param payload - Raw realtime payload from Supabase.
 * @param _supabaseClient - Initialized Supabase client (unused but kept for consistency).
 * @param context - Context containing the slice getter and share type.
 * @returns - An Effect that completes after applying the change locally.
 */
export default function handleShareSubscribeEvent(
	payload: unknown,
	_supabaseClient: Exclude<ReturnType<typeof getSupabaseClient>, undefined>,
	context: ShareEventContext,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
		const { get, shareType } = context;
		const {
			addReceivedShare,
			addSentShare,
			updateReceivedShare,
			updateSentShare,
			removeReceivedShare,
			removeSentShare,
		} = get();

		// Normalize payload: Supabase may send { eventType, new, old } or
		// wrapped { data: { type, record, old_record } }
		const normalized = normalizeRealtimePayload(payload);
		if (!isRealtimePayload(normalized)) {
			return;
		}

		const { eventType } = normalized;

		switch (eventType) {
			case "INSERT":
			case "UPDATE": {
				const newEntry = extractNewRecord(normalized);
				if (newEntry === undefined) {
					break;
				}

				if (!isSharedItem(newEntry)) {
					break;
				}

				// For shares, we can enrich with usernames if needed
				// For now, we'll store the basic share data
				const shareItem: SharedItem = {
					share_id: newEntry["share_id"],
					sender_user_id: newEntry["sender_user_id"],
					recipient_user_id: newEntry["recipient_user_id"],
					shared_item_type: newEntry["shared_item_type"],
					shared_item_id: newEntry["shared_item_id"],
					shared_item_name: newEntry["shared_item_name"],
					status: newEntry["status"],
					message: newEntry["message"] ?? undefined,
					created_at: newEntry["created_at"] || new Date().toISOString(),
					updated_at: newEntry["updated_at"] || new Date().toISOString(),
				};

				// Optionally enrich with usernames from the database
				// This could be added later if needed for display purposes

				yield* $(
					Effect.sync(() => {
						if (shareType === "received") {
							if (eventType === "INSERT") {
								addReceivedShare(shareItem);
							} else {
								updateReceivedShare(shareItem);
							}
						} else if (eventType === "INSERT") {
							addSentShare(shareItem);
						} else {
							updateSentShare(shareItem);
						}
					}),
				);
				break;
			}
			case "DELETE": {
				const oldEntry = normalized.old;
				const shareId = extractStringField(oldEntry, "share_id");
				if (shareId !== undefined) {
					yield* $(
						Effect.sync(() => {
							if (shareType === "received") {
								removeReceivedShare(shareId);
							} else {
								removeSentShare(shareId);
							}
						}),
					);
				}
				break;
			}
		}
	});
}
