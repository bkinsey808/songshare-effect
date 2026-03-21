import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiTagAddToItemPath, apiTagRemoveFromItemPath } from "@/shared/paths";

type ItemType = "song" | "playlist" | "event" | "community" | "image";

type SaveItemTagsResult = { success: true } | { success: false; errorMessage: string };

type SaveItemTagsParams = {
	itemType: ItemType;
	itemId: string;
	originalTags: readonly string[];
	nextTags: readonly string[];
};

/**
 * Diffs `nextTags` against `originalTags` and calls the add/remove tag API
 * endpoints for each change. All adds run in parallel, then all removes.
 *
 * @param params.itemType - The type of item being tagged
 * @param params.itemId - The UUID of the item
 * @param params.originalTags - Tag slugs as they were when the form was loaded
 * @param params.nextTags - Tag slugs as they are now (after user edits)
 * @returns Success or an error message
 */
export default async function saveItemTagsRequest({
	itemType,
	itemId,
	originalTags,
	nextTags,
}: SaveItemTagsParams): Promise<SaveItemTagsResult> {
	const originalSet = new Set(originalTags);
	const nextSet = new Set(nextTags);

	const toAdd = nextTags.filter((slug) => !originalSet.has(slug));
	const toRemove = originalTags.filter((slug) => !nextSet.has(slug));

	try {
		const responses = await Promise.all([
			...toAdd.map((slug) =>
				fetch(apiTagAddToItemPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ tag_slug: slug, item_type: itemType, item_id: itemId }),
					credentials: "include",
				}),
			),
			...toRemove.map((slug) =>
				fetch(apiTagRemoveFromItemPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ tag_slug: slug, item_type: itemType, item_id: itemId }),
					credentials: "include",
				}),
			),
		]);
		const failing = responses.find((res) => !res.ok);
		if (failing) {
			const body: unknown = await failing.json().catch(() => undefined);
			const message = extractErrorMessage(body, `Tag save failed (${failing.status.toString()})`);
			return { success: false, errorMessage: message };
		}
		return { success: true };
	} catch (error: unknown) {
		return { success: false, errorMessage: extractErrorMessage(error, "Failed to save tags") };
	}
}
