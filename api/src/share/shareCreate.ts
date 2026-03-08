import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import createShareRecord from "./shareCreateRecord";

type ShareCreateRequest = {
	recipient_user_id: string;
	shared_item_type: "song" | "playlist" | "event" | "community" | "user";
	shared_item_id: string;
	shared_item_name: string;
	message?: string;
};

/**
 * Extract and validate the request payload for creating a share.
 *
 * Ensures the incoming `request` is an object and contains all required
 * properties with correct types. Returns a sanitized `ShareCreateRequest` on success.
 *
 * @param request - The raw request payload (typically parsed JSON).
 * @returns - A validated `ShareCreateRequest`.
 * @throws - `TypeError` when the request is invalid.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSharedItemType(
	value: unknown,
): value is "song" | "playlist" | "event" | "community" | "user" {
	return (
		typeof value === "string" && ["song", "playlist", "event", "community", "user"].includes(value)
	);
}

function hasOwnerId(obj: unknown): obj is { owner_id: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"owner_id" in obj &&
		typeof (obj as { owner_id: unknown }).owner_id === "string"
	);
}

function hasUserId(obj: unknown): obj is { user_id: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"user_id" in obj &&
		typeof (obj as { user_id: unknown }).user_id === "string"
	);
}

function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
	return typeof value === "object" && value !== null && "data" in value && "error" in value;
}

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

	const validTypes = ["song", "playlist", "event", "community", "user"];
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

			// For songs, playlists: check if sender owns the item
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

/**
 * Server-side handler for creating a share.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - validates the shared item exists and sender has access
 * - creates share records using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The created share data, or fails with an error
 */
export default function shareCreateHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ shareId: string }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* shareCreateGen($) {
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
		let req: ShareCreateRequest = {
			recipient_user_id: "",
			shared_item_type: "song",
			shared_item_id: "",
			shared_item_name: "",
		};
		try {
			req = extractShareCreateRequest(requestBody);
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
		const senderUserId = userSession.user.user_id;

		// Prevent self-sharing
		if (senderUserId === req.recipient_user_id) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Cannot share items with yourself",
					}),
				),
			);
		}

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Validate shared item exists and sender has access
		const hasAccess = yield* $(
			validateSharedItemAccess({
				client,
				senderUserId,
				itemType: req.shared_item_type,
				itemId: req.shared_item_id,
			}),
		);

		if (!hasAccess) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Shared item not found or access denied",
					}),
				),
			);
		}

		// Create the share record
		const result = yield* $(createShareRecord(client, senderUserId, req));

		return result;
	});
}
