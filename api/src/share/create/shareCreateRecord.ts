import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError } from "@/api/api-errors";

type ShareCreateRequest = {
	recipient_user_id: string;
	shared_item_type: "song" | "playlist" | "event" | "community" | "user" | "image";
	shared_item_id: string;
	shared_item_name: string;
	message?: string;
};

/**
 * Find an existing share for the same sender, recipient, and item.
 * Returns the share_id and status if one exists, otherwise undefined.
 */
function findExistingShare(
	client: SupabaseClient<Database>,
	senderUserId: string,
	req: ShareCreateRequest,
): Effect.Effect<{ share_id: string; status: string } | undefined, DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			const { data, error } = await client
				.from("share_public")
				.select("share_id, status")
				.eq("sender_user_id", senderUserId)
				.eq("recipient_user_id", req.recipient_user_id)
				.eq("shared_item_type", req.shared_item_type)
				.eq("shared_item_id", req.shared_item_id)
				.maybeSingle();

			if (error !== null) {
				throw error;
			}

			if (data === null || data === undefined) {
				return undefined;
			}

			return { share_id: data.share_id, status: data.status };
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to check existing share"),
			}),
	});
}

/**
 * Reset an existing share back to pending status so it can be re-shared after
 * rejection or acceptance.
 */
function resetShareToPending(
	client: SupabaseClient<Database>,
	shareId: string,
	req: ShareCreateRequest,
): Effect.Effect<void, DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			const { error } = await client
				.from("share_public")
				.update({
					status: "pending",
					shared_item_name: req.shared_item_name,
					message: req.message ?? "",
				})
				.eq("share_id", shareId);

			if (error !== null) {
				throw error;
			}
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to reset share to pending"),
			}),
	});
}

/**
 * Create the share record in the database.
 * If a share already exists for the same sender, recipient, and item it is
 * reset to "pending" (re-share after rejection or acceptance) rather than
 * creating a duplicate.
 */
export default function createShareRecord(
	client: SupabaseClient<Database>,
	senderUserId: string,
	req: ShareCreateRequest,
): Effect.Effect<{ shareId: string }, DatabaseError> {
	return Effect.gen(function* createShareRecordGen($) {
		// Check for existing share first - one per user per item
		const existing = yield* $(findExistingShare(client, senderUserId, req));
		if (existing !== undefined) {
			// Re-share: reset to pending so the recipient can action it again.
			if (existing.status !== "pending") {
				yield* $(resetShareToPending(client, existing.share_id, req));
			}
			return { shareId: existing.share_id };
		}

		return yield* $(
			Effect.tryPromise({
				try: async () => {
					const { data: shareData, error: shareError } = await client
						.from("share")
						.insert([
							{
								sender_user_id: senderUserId,
								private_notes: "",
							},
						])
						.select()
						.single();

					if (shareError !== null || shareData === null || shareData === undefined) {
						throw shareError ?? new Error("No share data returned");
					}

					const shareId = shareData.share_id;

					const { error: publicError } = await client.from("share_public").insert([
						{
							share_id: shareId,
							sender_user_id: senderUserId,
							recipient_user_id: req.recipient_user_id,
							shared_item_type: req.shared_item_type,
							shared_item_id: req.shared_item_id,
							shared_item_name: req.shared_item_name,
							status: "pending",
							message: req.message ?? "",
						},
					]);

					if (publicError !== null) {
						throw publicError;
					}

					const { error: libraryError } = await client.from("share_library").insert([
						{
							user_id: req.recipient_user_id,
							share_id: shareId,
						},
					]);

					if (libraryError !== null) {
						throw libraryError;
					}

					return { shareId };
				},
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to create share"),
					}),
			}),
		);
	});
}
