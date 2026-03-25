import { Effect } from "effect";

import { DatabaseError } from "@/api/api-errors";
import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { TagItemType } from "./add-to-item/extractAddTagToItemRequest";

/**
 * Fetch the owner ID for a tagged item from the appropriate public table.
 * Returns the owner's user_id string, or fails with a DatabaseError if the
 * item is not found.
 *
 * @param client - Supabase service-role client.
 * @param itemType - The type of item being checked.
 * @param itemId - The UUID of the item.
 * @returns The owner's user_id.
 */
export default function getTagItemOwner(
	client: ReturnType<typeof getSupabaseServerClient>,
	itemType: TagItemType,
	itemId: string,
): Effect.Effect<string, DatabaseError> {
	return Effect.gen(function* getTagItemOwnerGen($) {
		if (itemType === "song") {
			const result = yield* $(
				Effect.tryPromise({
					try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
					catch: (error) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
				}),
			);
			if (result.error || result.data === null) {
				return yield* $(Effect.fail(new DatabaseError({ message: "Song not found" })));
			}
			return result.data.user_id;
		}

		if (itemType === "playlist") {
			const result = yield* $(
				Effect.tryPromise({
					try: () =>
						client.from("playlist_public").select("user_id").eq("playlist_id", itemId).single(),
					catch: (error) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to fetch playlist"),
						}),
				}),
			);
			if (result.error || result.data === null) {
				return yield* $(Effect.fail(new DatabaseError({ message: "Playlist not found" })));
			}
			return result.data.user_id;
		}

		if (itemType === "event") {
			const result = yield* $(
				Effect.tryPromise({
					try: () => client.from("event_public").select("owner_id").eq("event_id", itemId).single(),
					catch: (error) =>
						new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch event") }),
				}),
			);
			if (result.error || result.data === null) {
				return yield* $(Effect.fail(new DatabaseError({ message: "Event not found" })));
			}
			return result.data.owner_id;
		}

		if (itemType === "community") {
			const result = yield* $(
				Effect.tryPromise({
					try: () =>
						client.from("community_public").select("owner_id").eq("community_id", itemId).single(),
					catch: (error) =>
						new DatabaseError({
							message: extractErrorMessage(error, "Failed to fetch community"),
						}),
				}),
			);
			if (result.error || result.data === null) {
				return yield* $(Effect.fail(new DatabaseError({ message: "Community not found" })));
			}
			return result.data.owner_id;
		}

		// image
		const result = yield* $(
			Effect.tryPromise({
				try: () => client.from("image_public").select("user_id").eq("image_id", itemId).single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch image") }),
			}),
		);
		if (result.error || result.data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Image not found" })));
		}
		return result.data.user_id;
	});
}
