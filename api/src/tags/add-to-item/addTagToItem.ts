import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import getTagItemOwner from "../getTagItemOwner";
import extractAddTagToItemRequest, { type AddTagToItemRequest } from "./extractAddTagToItemRequest";

/**
 * Server-side handler for adding a tag to an item.
 * Creates the tag in the global registry if it does not exist.
 * Verifies that the current user owns the item before tagging.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ tag_slug }` on success, or fails with a typed error.
 */
export default function addTagToItem(
	ctx: ReadonlyContext,
): Effect.Effect<{ tag_slug: string }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addTagToItemGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: AddTagToItemRequest = { tag_slug: "", item_type: "song", item_id: "" };
		try {
			req = extractAddTagToItemRequest(body);
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
					new ValidationError({ message: "You do not have permission to tag this item" }),
				),
			);
		}

		// Upsert the tag into the global registry
		yield* $(
			Effect.tryPromise({
				try: async () => {
					const result = await client
						.from("tag")
						.upsert({ tag_slug: req.tag_slug }, { onConflict: "tag_slug", ignoreDuplicates: true });
					if (result.error) {
						throw result.error;
					}
				},
				catch: (error: unknown) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to upsert tag") }),
			}),
		);

		// Upsert into the appropriate *_tag junction table
		if (req.item_type === "song") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("song_tag")
							.upsert(
								{ song_id: req.item_id, tag_slug: req.tag_slug },
								{ onConflict: "song_id,tag_slug", ignoreDuplicates: true },
							);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to tag item") }),
				}),
			);
		} else if (req.item_type === "playlist") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("playlist_tag")
							.upsert(
								{ playlist_id: req.item_id, tag_slug: req.tag_slug },
								{ onConflict: "playlist_id,tag_slug", ignoreDuplicates: true },
							);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to tag item") }),
				}),
			);
		} else if (req.item_type === "event") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("event_tag")
							.upsert(
								{ event_id: req.item_id, tag_slug: req.tag_slug },
								{ onConflict: "event_id,tag_slug", ignoreDuplicates: true },
							);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to tag item") }),
				}),
			);
		} else if (req.item_type === "community") {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("community_tag")
							.upsert(
								{ community_id: req.item_id, tag_slug: req.tag_slug },
								{ onConflict: "community_id,tag_slug", ignoreDuplicates: true },
							);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to tag item") }),
				}),
			);
		} else {
			// image
			yield* $(
				Effect.tryPromise({
					try: async () => {
						const result = await client
							.from("image_tag")
							.upsert(
								{ image_id: req.item_id, tag_slug: req.tag_slug },
								{ onConflict: "image_id,tag_slug", ignoreDuplicates: true },
							);
						if (result.error) {
							throw result.error;
						}
					},
					catch: (error: unknown) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to tag item") }),
				}),
			);
		}

		// Best-effort: add the tag to the user's tag library so manually-entered
		// tags are remembered for future autocomplete. Ignore failures.
		yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("tag_library")
						.upsert(
							{ user_id: userId, tag_slug: req.tag_slug },
							{ onConflict: "user_id,tag_slug", ignoreDuplicates: true },
						),
				catch: () => new DatabaseError({ message: "Failed to add tag to library" }),
			}).pipe(Effect.orElse(() => Effect.void)),
		);

		return { tag_slug: req.tag_slug };
	});
}
