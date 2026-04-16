import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiTagAddToItemPath, apiTagRemoveFromItemPath } from "@/shared/paths";

import fetchTagEffect from "./fetchTagEffect";

type ItemType = "song" | "playlist" | "event" | "community" | "image";

type SaveItemTagsParams = {
	itemType: ItemType;
	itemId: string;
	originalTags: readonly string[];
	nextTags: readonly string[];
};

/**
 * Diffs `nextTags` against `originalTags` and calls the add/remove tag API
 * endpoints for each change. All requests run in parallel.
 *
 * @param itemType - The type of item being tagged
 * @param itemId - The UUID of the item
 * @param originalTags - Tag slugs as they were when the form was loaded
 * @param nextTags - Tag slugs as they are now (after user edits)
 * @returns An Effect that resolves when all tag changes are saved, or fails with an Error.
 */
export default function saveItemTagsEffect({
	itemType,
	itemId,
	originalTags,
	nextTags,
}: SaveItemTagsParams): Effect.Effect<void, Error> {
	/**
	 * Builds the request body for add/remove tag API calls.
	 *
	 * @param slug - Tag slug to include in the request body
	 * @returns Request body for the tag API
	 */
	function makeBody(slug: string): { tag_slug: string; item_type: ItemType; item_id: string } {
		return { tag_slug: slug, item_type: itemType, item_id: itemId };
	}

	return Effect.gen(function* saveItemTagsGen($) {
		const originalSet = new Set(originalTags);
		const nextSet = new Set(nextTags);

		const toAdd = nextTags.filter((slug) => !originalSet.has(slug));
		const toRemove = originalTags.filter((slug) => !nextSet.has(slug));

		const responses = yield* $(
			Effect.all(
				[
					...toAdd.map((slug) => fetchTagEffect(apiTagAddToItemPath, makeBody(slug))),
					...toRemove.map((slug) => fetchTagEffect(apiTagRemoveFromItemPath, makeBody(slug))),
				],
				{ concurrency: "unbounded" },
			),
		);

		const failing = responses.find((res) => !res.ok);
		if (!failing) {
			return;
		}

		const body = yield* $(
			Effect.promise(() => failing.json().catch(() => undefined) as Promise<unknown>),
		);

		const message = extractErrorMessage(body, `Tag save failed (${failing.status.toString()})`);
		return yield* $(Effect.fail(new Error(message)));
	});
}
