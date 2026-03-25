import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import fetchItemTagsEffect from "../tag-library/image/fetchItemTagsRequest";
import saveItemTagsEffect from "../tag-library/saveItemTagsRequest";

type ItemType = "song" | "playlist" | "event" | "community" | "image";

/** Result of attempting to persist tag changes. */
type SaveTagsResult = { success: true } | { success: false; errorMessage: string };

/**
 * The public return shape of the `useItemTags` hook.
 *
 * Consumers receive a read-only `tags` array and helpers to update and
 * persist tag changes for the current item.
 */
type UseItemTagsReturn = {
	tags: readonly string[];
	setTags: (tags: readonly string[]) => void;
	saveTags: (itemId: string) => Promise<SaveTagsResult>;
	isLoadingTags: boolean;
};

/**
 * Manages tag state for an edit form.
 *
 * Fetches the item's current tags on mount and stores the original snapshot
 * so `saveTags` can compute a diff and persist only changed values.
 *
 * @param itemType - The type of item (song, playlist, event, community, image).
 * @param itemId - UUID of the item; when `undefined` the hook is a no-op.
 * @returns The hook return object with the following properties:
 * @returns tags - Current tags (readonly array) stored in local state.
 * @returns setTags - Replaces the local tag list with the supplied tags.
 * @returns saveTags - Persists changes for the given item id and returns a result.
 * @returns isLoadingTags - True while tags are being fetched from the server.
 */
export default function useItemTags(
	itemType: ItemType,
	itemId: string | undefined,
): UseItemTagsReturn {
	const [tags, setTagsInternal] = useState<string[]>([]);
	const [isLoadingTags, setIsLoadingTags] = useState(false);
	const originalTagsRef = useRef<string[]>([]);

	function setTags(nextTags: readonly string[]): void {
		setTagsInternal([...nextTags]);
	}

	/**
	 * Replace the current tag list.
	 *
	 * @param nextTags - New tag list (readonly) to set into local state.
	 * @returns void
	 */

	// Fetch the item's existing tags when editing (itemId is defined).
	useEffect(() => {
		if (itemId === undefined || itemId.trim() === "") {
			return;
		}
		setIsLoadingTags(true);
		void (async (): Promise<void> => {
			const fetched = await Effect.runPromise(fetchItemTagsEffect(itemType, itemId));
			setTags(fetched);
			originalTagsRef.current = fetched;
			setIsLoadingTags(false);
		})();
	}, [itemType, itemId]);

	async function saveTags(id: string): Promise<SaveTagsResult> {
		try {
			await Effect.runPromise(
				saveItemTagsEffect({
					itemType,
					itemId: id,
					originalTags: originalTagsRef.current,
					nextTags: tags,
				}),
			);
			return { success: true };
		} catch (error: unknown) {
			return {
				success: false,
				errorMessage: error instanceof Error ? error.message : "Failed to save tags",
			};
		}
	}

	/**
	 * Persist tag changes for the specified item id.
	 *
	 * The function sends the original tags (from mount) and the current local
	 * `tags` so the server can compute and apply the minimal update.
	 *
	 * @param id - UUID of the item to save tags for.
	 * @returns A `SaveTagsResult` indicating success or failure with an error message.
	 */

	return { tags, setTags, saveTags, isLoadingTags };
}
