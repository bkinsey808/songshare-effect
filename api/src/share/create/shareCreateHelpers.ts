import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { DatabaseError } from "@/api/api-errors";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";

type ShareCreateRequest = {
	recipient_user_id: string;
	shared_item_type: "song" | "playlist" | "event" | "community" | "user" | "image";
	shared_item_id: string;
	shared_item_name: string;
	message?: string;
};

/**
 * Check if the given value is a valid shared item type.
 * @param value - The value to check.
 * @returns True if the value is a valid shared item type.
 */
function isValidSharedItemType(
	value: unknown,
): value is "song" | "playlist" | "event" | "community" | "user" | "image" {
	return (
		typeof value === "string" &&
		["song", "playlist", "event", "community", "user", "image"].includes(value)
	);
}

/**
 * Type guard for an object containing an `owner_id`.
 * @param obj - The object to test.
 * @returns True if the object has a string `owner_id`.
 */
function hasOwnerId(obj: unknown): obj is { owner_id: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"owner_id" in obj &&
		typeof (obj as { owner_id: unknown }).owner_id === "string"
	);
}

/**
 * Type guard for an object containing a `user_id`.
 * @param obj - The object to test.
 * @returns True if the object has a string `user_id`.
 */
function hasUserId(obj: unknown): obj is { user_id: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"user_id" in obj &&
		typeof (obj as { user_id: unknown }).user_id === "string"
	);
}

/**
 * Check if the value is a Supabase query result object.
 * @param value - The value to test.
 * @returns True if the object has `data` and `error` properties.
 */
function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
	return typeof value === "object" && value !== null && "data" in value && "error" in value;
}

/**
 * Extract and validate a share creation request from an unknown payload.
 * @param request - The raw request payload.
 * @returns A validated ShareCreateRequest.
 * @throws {TypeError} If validation fails.
 */
function extractShareCreateRequest(request: unknown): ShareCreateRequest {
	if (!isRecord(request)) {
		throw new TypeError("Request must be a valid object");
	}

	const requiredFields = [
		"recipient_user_id",
		"shared_item_type",
		"shared_item_id",
		"shared_item_name",
	] as const;

	for (const field of requiredFields) {
		if (!(field in request)) {
			throw new TypeError(`Request must contain ${field}`);
		}
	}

	const { recipient_user_id, shared_item_type, shared_item_id, shared_item_name, message } =
		request;

	if (typeof recipient_user_id !== "string") {
		throw new TypeError("recipient_user_id must be a string");
	}

	if (!isValidSharedItemType(shared_item_type)) {
		throw new TypeError("shared_item_type must be one of: song, playlist, event, community, user");
	}

	const validTypes = ["song", "playlist", "event", "community", "user", "image"];
	if (!validTypes.includes(shared_item_type)) {
		throw new TypeError(`shared_item_type must be one of: ${validTypes.join(", ")}`);
	}

	if (typeof shared_item_id !== "string") {
		throw new TypeError("shared_item_id must be a string");
	}

	if (typeof shared_item_name !== "string") {
		throw new TypeError("shared_item_name must be a string");
	}

	if (message !== undefined && typeof message !== "string") {
		throw new TypeError("message must be a string if provided");
	}

	return {
		recipient_user_id,
		shared_item_type,
		shared_item_id,
		shared_item_name,
		...(message !== undefined && { message }),
	};
}

type ValidateSharedItemAccessParams = {
	client: SupabaseClient<Database>;
	senderUserId: string;
	itemType: string;
	itemId: string;
};

/**
 * Validate that the shared item exists and the sender has access to it.
 * @param params - The validation parameters.
 * @returns An Effect that succeeds with a boolean or fails with a DatabaseError.
 */
function validateSharedItemAccess(
	params: ValidateSharedItemAccessParams,
): Effect.Effect<boolean, DatabaseError> {
	const { client, senderUserId, itemType, itemId } = params;
	return Effect.tryPromise({
		try: async () => {
			let query: unknown = undefined;

			switch (itemType) {
				case "song": {
					query = client.from("song").select("user_id").eq("song_id", itemId).single();
					break;
				}
				case "playlist": {
					query = client.from("playlist").select("user_id").eq("playlist_id", itemId).single();
					break;
				}
				case "event": {
					query = client.from("event").select("owner_id").eq("event_id", itemId).single();
					break;
				}
				case "community": {
					query = client.from("community").select("owner_id").eq("community_id", itemId).single();
					break;
				}
				case "user": {
					query = client.from("user").select("user_id").eq("user_id", itemId).single();
					break;
				}
				case "image": {
					query = client.from("image_public").select("user_id").eq("image_id", itemId).single();
					break;
				}
				default: {
					throw new Error(`Invalid item type: ${itemType}`);
				}
			}

			const result: unknown = await query;
			if (!isSupabaseResult(result)) {
				throw new Error("Invalid query result format");
			}

			const { data, error } = result;

			if (error !== null && error !== undefined) {
				throw new Error(error instanceof Error ? error.message : "Database query failed");
			}

			if (data === null || data === undefined) {
				return false;
			}

			// For songs, playlists, images: check if sender owns the item
			// For events, communities: check if sender owns the item
			// For users: any authenticated user can share any user (following relationship)
			if (itemType === "user") {
				return true; // Any user can share any other user
			}

			const ownerField = itemType === "event" || itemType === "community" ? "owner_id" : "user_id";
			let ownerId = "";
			if (ownerField === "owner_id") {
				if (!hasOwnerId(data)) {
					throw new Error("Expected owner_id in data");
				}
				ownerId = data.owner_id;
			} else {
				if (!hasUserId(data)) {
					throw new Error("Expected user_id in data");
				}
				ownerId = data.user_id;
			}
			return ownerId === senderUserId;
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to validate shared item access"),
			}),
	});
}

type AddCommunityInviteParams = {
	communityId: string;
	recipientUserId: string;
};

/**
 * Adds the recipient to community_user with status "invited" when sharing a community.
 * Skips if they are already joined or invited. Re-invites if they left or were kicked.
 * @param client - Supabase client.
 * @param params - Community and recipient IDs.
 * @returns An Effect that succeeds or fails with a DatabaseError.
 */
function addCommunityInviteOnShare(
	client: SupabaseClient<Database>,
	params: AddCommunityInviteParams,
): Effect.Effect<void, DatabaseError> {
	const { communityId, recipientUserId } = params;
	return Effect.gen(function* addCommunityInviteGen($) {
		const existing = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("community_user")
						.select("status")
						.eq("community_id", communityId)
						.eq("user_id", recipientUserId)
						.maybeSingle(),
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to check community membership"),
					}),
			}),
		);

		if (existing.data?.status === "joined" || existing.data?.status === "invited") {
			return;
		}

		yield* $(
			Effect.tryPromise({
				try: async () => {
					const result = await client.from("community_user").upsert(
						[
							{
								community_id: communityId,
								user_id: recipientUserId,
								role: "member",
								status: "invited",
							},
						],
						{ onConflict: "community_id,user_id" },
					);
					if (result.error !== null) {
						throw result.error;
					}
				},
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to add community invitation"),
					}),
			}),
		);
	});
}

export type { AddCommunityInviteParams, ShareCreateRequest, ValidateSharedItemAccessParams };

export { addCommunityInviteOnShare, extractShareCreateRequest, validateSharedItemAccess };
