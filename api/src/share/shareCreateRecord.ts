import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError } from "../api-errors";

type ShareCreateRequest = {
	recipient_user_id: string;
	shared_item_type: "song" | "playlist" | "event" | "community" | "user";
	shared_item_id: string;
	shared_item_name: string;
	message?: string;
};

/**
 * Find an existing share for the same sender, recipient, and item.
 * Returns the share_id if one exists, otherwise undefined.
 */
function findExistingShare(
	client: SupabaseClient<Database>,
	senderUserId: string,
	req: ShareCreateRequest,
): Effect.Effect<string | undefined, DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			const { data, error } = await client
				.from("share_public")
				.select("share_id")
				.eq("sender_user_id", senderUserId)
				.eq("recipient_user_id", req.recipient_user_id)
				.eq("shared_item_type", req.shared_item_type)
				.eq("shared_item_id", req.shared_item_id)
				.maybeSingle();

			if (error !== null) {
				throw error;
			}

			return data?.share_id;
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to check existing share"),
			}),
	});
}

/**
 * Create the share record in the database.
 * If a share already exists for the same sender, recipient, and item, returns that share_id instead of creating a duplicate.
 */
export default function createShareRecord(
	client: SupabaseClient<Database>,
	senderUserId: string,
	req: ShareCreateRequest,
): Effect.Effect<{ shareId: string }, DatabaseError> {
	return Effect.gen(function* createShareRecordGen($) {
		// Check for existing share first - one per user per item
		const existingShareId = yield* $(findExistingShare(client, senderUserId, req));
		if (existingShareId !== undefined) {
			return { shareId: existingShareId };
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
