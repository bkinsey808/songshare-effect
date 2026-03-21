import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import fetchItemTagsEffect from "../tag-library/image/fetchItemTagsRequest";
import saveItemTagsEffect from "../tag-library/saveItemTagsRequest";

type ItemType = "song" | "playlist" | "event" | "community" | "image";

type SaveTagsResult = { success: true } | { success: false; errorMessage: string };

type UseItemTagsReturn = {
	tags: readonly string[];
	setTags: (tags: readonly string[]) => void;
	saveTags: (itemId: string) => Promise<SaveTagsResult>;
	isLoadingTags: boolean;
};

/**
 * Manages tag state for an edit form. Fetches the item's current tags on mount
 * and stores the original snapshot so `saveTags` can diff and persist changes.
 *
 * @param itemType - The type of item (song, playlist, event, community, image)
 * @param itemId - UUID of the item; when undefined the hook is a no-op
 * @returns tags, setTags, saveTags, isLoadingTags
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
				saveItemTagsEffect({ itemType, itemId: id, originalTags: originalTagsRef.current, nextTags: tags }),
			);
			return { success: true };
		} catch (error: unknown) {
			return {
				success: false,
				errorMessage: error instanceof Error ? error.message : "Failed to save tags",
			};
		}
	}

	return { tags, setTags, saveTags, isLoadingTags };
}
