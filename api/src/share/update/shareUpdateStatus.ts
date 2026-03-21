import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import addPlaylistSongsToUserLibrary from "@/api/playlist-library/addPlaylistSongsToUserLibrary";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

type ShareUpdateStatusRequest = {
	share_id: string;
	status: "accepted" | "rejected";
};

type ShareStatus = "pending" | "accepted" | "rejected";

/**
 * Validates whether the provided string is a valid update status.
 * @param value - The status string to validate.
 * @returns true if the status is 'accepted' or 'rejected'.
 */
function isValidUpdateStatus(value: string): value is "accepted" | "rejected" {
	return ["accepted", "rejected"].includes(value);
}

/**
 * Extract and validate the request payload for updating share status.
 * @param request - The raw request body.
 * @returns A validated ShareUpdateStatusRequest object.
 */
function extractShareUpdateStatusRequest(request: unknown): ShareUpdateStatusRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("share_id" in request)) {
		throw new TypeError("Request must contain share_id");
	}

	if (!("status" in request)) {
		throw new TypeError("Request must contain status");
	}

	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be an object");
	}

	const { share_id, status } = request as Record<string, unknown>;

	if (typeof share_id !== "string") {
		throw new TypeError("share_id must be a string");
	}

	if (typeof status !== "string") {
		throw new TypeError("status must be a string");
	}

	if (!isValidUpdateStatus(status)) {
		throw new TypeError(`status must be one of: accepted, rejected`);
	}

	return {
		share_id,
		status,
	};
}

/**
 * Get share details and verify recipient authorization.
 * @param client - The Supabase client.
 * @param shareId - The ID of the share to retrieve.
 * @param recipientUserId - The ID of the user who should have received the share.
 * @returns An Effect that succeeds with share details or fails with a DatabaseError.
 */
function getShareForRecipient(
	client: SupabaseClient<Database>,
	shareId: string,
	recipientUserId: string,
): Effect.Effect<
	{
		shared_item_type: string;
		shared_item_id: string;
		shared_item_name: string;
		sender_user_id: string;
	},
	DatabaseError
> {
	return Effect.tryPromise({
		try: async () => {
			const { data, error } = await client
				.from("share_public")
				.select(
					"shared_item_type, shared_item_id, shared_item_name, sender_user_id, recipient_user_id, status",
				)
				.eq("share_id", shareId)
				.single();

			if (error) {
				throw error;
			}

			if (data === null || data === undefined) {
				throw new Error("Share not found");
			}

			if (data.recipient_user_id !== recipientUserId) {
				throw new Error("Not authorized to update this share");
			}

			if (data.status !== "pending") {
				throw new Error("Share has already been processed");
			}

			return {
				shared_item_type: data.shared_item_type,
				shared_item_id: data.shared_item_id,
				shared_item_name: data.shared_item_name,
				sender_user_id: data.sender_user_id,
			};
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to get share details"),
			}),
	});
}

type AddItemToLibraryParams = {
	client: SupabaseClient<Database>;
	recipientUserId: string;
	itemType: string;
	itemId: string;
	senderUserId: string;
};

/**
 * Add accepted item to recipient's appropriate library.
 * @param params - The parameters for adding the item to the library.
 * @returns An Effect that succeeds when the item is added.
 */
function addItemToLibrary(params: AddItemToLibraryParams): Effect.Effect<void, DatabaseError> {
	const { client, recipientUserId, itemType, itemId, senderUserId } = params;
	return Effect.tryPromise({
		try: async () => {
			try {
				switch (itemType) {
					case "song": {
						await client.from("song_library").insert([
							{
								user_id: recipientUserId,
								song_id: itemId,
								song_owner_id: senderUserId,
							},
						]);
						break;
					}
					case "playlist": {
						await client.from("playlist_library").insert([
							{
								user_id: recipientUserId,
								playlist_id: itemId,
								playlist_owner_id: senderUserId,
							},
						]);
						break;
					}
					case "event": {
						// Add to event library
						await client.from("event_library").insert([
							{
								user_id: recipientUserId,
								event_id: itemId,
								event_owner_id: senderUserId,
							},
						]);
						break;
					}
					case "user": {
						await client.from("user_library").insert([
							{
								user_id: recipientUserId,
								followed_user_id: itemId,
							},
						]);
						break;
					}
					case "community": {
						await client.from("community_user").insert([
							{
								community_id: itemId,
								user_id: recipientUserId,
								role: "member",
								status: "joined",
							},
						]);
						break;
					}
					case "image": {
						await client.from("image_library").insert([
							{
								user_id: recipientUserId,
								image_id: itemId,
								image_owner_id: senderUserId,
							},
						]);
						break;
					}
					default: {
						throw new Error(`Invalid item type: ${itemType}`);
					}
				}
			} catch (error) {
				// Handle duplicate key errors gracefully - item might already be in library
				const errorMessage = extractErrorMessage(error, "Failed to add item to library");
				if (errorMessage.includes("duplicate key") || errorMessage.includes("already exists")) {
					// Item already in library - this is okay, just continue
					return;
				}
				throw error;
			}
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add item to library"),
			}),
	});
}

/**
 * Update the share status in the database.
 * @param client - The Supabase client.
 * @param shareId - The ID of the share to update.
 * @param status - The new status to set.
 * @returns An Effect that succeeds when the status is updated.
 */
function updateShareStatus(
	client: SupabaseClient<Database>,
	shareId: string,
	status: ShareStatus,
): Effect.Effect<void, DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			const { error } = await client
				.from("share_public")
				.update({ status })
				.eq("share_id", shareId);

			if (error) {
				throw error;
			}
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to update share status"),
			}),
	});
}

/**
 * Server-side handler for updating share status.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication and authorization
 * - updates the share status
 * - if accepted, adds the item to the recipient's appropriate library
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success confirmation or fails with an error
 */
export default function shareUpdateStatusHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* shareUpdateStatusGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request structure
		let req: ShareUpdateStatusRequest = { share_id: "", status: "accepted" };
		try {
			req = extractShareUpdateStatusRequest(requestBody);
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
				),
			);
		}

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const recipientUserId = userSession.user.user_id;

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Get share details and verify authorization
		const shareDetails = yield* $(getShareForRecipient(client, req.share_id, recipientUserId));

		// If accepting the share, add item to recipient's library
		if (req.status === "accepted") {
			yield* $(
				addItemToLibrary({
					client,
					recipientUserId,
					itemType: shareDetails.shared_item_type,
					itemId: shareDetails.shared_item_id,
					senderUserId: shareDetails.sender_user_id,
				}),
			);

			// For playlists, also add the playlist's songs to the user's song library.
			// Non-fatal: if this fails, the share is still accepted and the playlist is in library.
			if (shareDetails.shared_item_type === "playlist") {
				yield* $(
					addPlaylistSongsToUserLibrary(client, recipientUserId, shareDetails.shared_item_id).pipe(
						Effect.catchAll((err) =>
							Effect.sync(() => {
								console.warn(
									"[shareUpdateStatus] Failed to add playlist songs to song library:",
									err,
								);
							}),
						),
					),
				);
			}
		}

		// Update the share status
		yield* $(updateShareStatus(client, req.share_id, req.status));

		return { success: true };
	});
}
