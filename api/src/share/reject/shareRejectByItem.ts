import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";

const VALID_ITEM_TYPES = ["song", "playlist", "event", "community", "user"] as const;
type SharedItemType = (typeof VALID_ITEM_TYPES)[number];

type RejectByItemRequest = {
	shared_item_type: SharedItemType;
	shared_item_id: string;
};

function extractRejectByItemRequest(body: unknown): RejectByItemRequest {
	if (!isRecord(body)) {
		throw new TypeError("Request must be an object");
	}
	const typeVal = body.shared_item_type;
	if (typeof typeVal !== "string" || !(VALID_ITEM_TYPES as readonly string[]).includes(typeVal)) {
		throw new TypeError(`shared_item_type must be one of: ${VALID_ITEM_TYPES.join(", ")}`);
	}
	const idVal = body.shared_item_id;
	if (typeof idVal !== "string" || idVal === "") {
		throw new TypeError("shared_item_id must be a non-empty string");
	}
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- typeVal validated against VALID_ITEM_TYPES above
	const sharedItemType = typeVal as SharedItemType;
	return { shared_item_type: sharedItemType, shared_item_id: idVal };
}

type RejectByItemParams = {
	client: SupabaseClient<Database>;
	recipientUserId: string;
	itemType: string;
	itemId: string;
};

function performRejectByItem(params: RejectByItemParams): Effect.Effect<number, DatabaseError> {
	const { client, recipientUserId, itemType, itemId } = params;
	return Effect.tryPromise({
		try: async () => {
			const { data: rows, error } = await client
				.from("share_public")
				.select("share_id")
				.eq("recipient_user_id", recipientUserId)
				.eq("shared_item_type", itemType)
				.eq("shared_item_id", itemId)
				.eq("status", "accepted");

			if (error) {
				throw error;
			}

			const shareIds = (rows ?? []).map((row) => row.share_id).filter(Boolean);
			const updatePromises = shareIds.map((shareId) =>
				client.from("share_public").update({ status: "rejected" }).eq("share_id", shareId),
			);
			const updateResults = await Promise.all(updatePromises);
			for (const { error: updateError } of updateResults) {
				if (updateError) {
					throw new Error(extractErrorMessage(updateError, "Failed to update share status"));
				}
			}
			return shareIds.length;
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to reject shares by item"),
			}),
	});
}

/**
 * Rejects all accepted received shares that match the given item.
 * Called when the user removes an item from their library.
 */
export default function shareRejectByItemHandler(
	ctx: ReadonlyContext,
): Effect.Effect<
	{ success: boolean; rejected_count: number },
	ValidationError | DatabaseError | AuthenticationError
> {
	return Effect.gen(function* shareRejectByItemGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const req = yield* $(
			Effect.try({
				try: () => extractRejectByItemRequest(requestBody),
				catch: (error) =>
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
			}),
		);

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const recipientUserId = userSession.user.user_id;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
		const rejectedCount = yield* $(
			performRejectByItem({
				client,
				recipientUserId,
				itemType: req.shared_item_type,
				itemId: req.shared_item_id,
			}),
		);

		return { success: true, rejected_count: rejectedCount };
	});
}
