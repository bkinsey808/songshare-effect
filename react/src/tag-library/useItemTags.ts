import { useCallback, useEffect, useRef, useState } from "react";

import fetchItemTagsRequest from "./fetchItemTagsRequest";
import saveItemTagsRequest from "./saveItemTagsRequest";

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

	const setTags = useCallback((nextTags: readonly string[]) => {
		setTagsInternal([...nextTags]);
	}, []);

	// Fetch the item's existing tags when editing (itemId is defined).
	useEffect(() => {
		if (itemId === undefined || itemId.trim() === "") {
			return;
		}
		setIsLoadingTags(true);
		void (async (): Promise<void> => {
			const fetched = await fetchItemTagsRequest(itemType, itemId);
			setTags(fetched);
			originalTagsRef.current = fetched;
			setIsLoadingTags(false);
		})();
	}, [itemType, itemId, setTags]);

	const saveTags = useCallback(
		(id: string): Promise<SaveTagsResult> =>
			saveItemTagsRequest({ itemType, itemId: id, originalTags: originalTagsRef.current, nextTags: tags }),
		[itemType, tags],
	);

	return { tags, setTags, saveTags, isLoadingTags };
}
