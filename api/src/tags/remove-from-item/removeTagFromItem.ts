import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import getTagItemOwner from "../getTagItemOwner";
import extractRemoveTagFromItemRequest, {
	type RemoveTagFromItemRequest,
} from "./extractRemoveTagFromItemRequest";

/**
 * Server-side handler for removing a tag from an item.
 * Verifies that the current user owns the item before removing the tag.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function removeTagFromItem(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removeTagFromItemGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: RemoveTagFromItemRequest = { tag_slug: "", item_type: "song", item_id: "" };
		try {
			req = extractRemoveTagFromItemRequest(body);
		} catch (error: unknown) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: extractErrorMessage(error, "Invalid request") }),
				),
			);
		}

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const ownerId = yield* $(getTagItemOwner(client, req.item_type, req.item_id));

		if (ownerId !== userId) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: "You do not have permission to untag this item" }),
				),
			);
		}

		// Delete from the appropriate *_tag junction table
		if (req.item_type === "song") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("song_tag")
							.delete()
							.eq("song_id", req.item_id)
							.eq("tag_slug", req.tag_slug);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to remove tag from item"),
						}),
				}),
			);
		} else if (req.item_type === "playlist") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("playlist_tag")
							.delete()
							.eq("playlist_id", req.item_id)
							.eq("tag_slug", req.tag_slug);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to remove tag from item"),
						}),
				}),
			);
		} else if (req.item_type === "event") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("event_tag")
							.delete()
							.eq("event_id", req.item_id)
							.eq("tag_slug", req.tag_slug);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to remove tag from item"),
						}),
				}),
			);
		} else if (req.item_type === "community") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("community_tag")
							.delete()
							.eq("community_id", req.item_id)
							.eq("tag_slug", req.tag_slug);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to remove tag from item"),
						}),
				}),
			);
		} else {
			// image
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("image_tag")
							.delete()
							.eq("image_id", req.item_id)
							.eq("tag_slug", req.tag_slug);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to remove tag from item"),
						}),
				}),
			);
		}

		return { success: true };
	});
}
