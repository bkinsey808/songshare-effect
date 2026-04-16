import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import fetchItemTagsEffect from "../tag-library/image/fetchItemTagsRequest";
import saveItemTagsEffect from "../tag-library/saveItemTagsRequest";

type ItemType = "song" | "playlist" | "event" | "community" | "image";

const ZERO_TAGS = 0;
const TAG_FETCH_RETRY_DELAY_MS = 1500;

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
	getTags: () => readonly string[];
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
	const hasExistingItem = itemId !== undefined && itemId.trim() !== "";
	const [tags, setTagsInternal] = useState<string[]>([]);
	const [isLoadingTags, setIsLoadingTags] = useState(hasExistingItem);
	const originalTagsRef = useRef<string[]>([]);
	const currentTagsRef = useRef<string[]>([]);
	const hasLocalTagEditsRef = useRef(false);

	/**
	 * Replace the current local tag list with `nextTags`.
	 *
	 * @param nextTags - New tag list to set locally
	 * @returns void
	 */
	function setTags(nextTags: readonly string[]): void {
		hasLocalTagEditsRef.current = true;
		const next = [...nextTags];
		currentTagsRef.current = next;
		setTagsInternal(next);
	}

	/**
	 * Returns the current in-memory tag list.
	 *
	 * @returns Readonly array of current tags
	 */
	function getTags(): readonly string[] {
		return currentTagsRef.current;
	}

	// Fetch the item's existing tags when editing (itemId is defined).
	useEffect(() => {
		if (itemId === undefined || itemId.trim() === "") {
			return;
		}
		const stableItemId = itemId;
		hasLocalTagEditsRef.current = false;
		setIsLoadingTags(true);
		let isActive = true;
		let retryTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

		/**
		 * Load tags for the stable item id and populate local state.
		 *
		 * @param allowRetry - Whether an empty result should trigger a retry
		 * @returns void
		 */
		function loadTags(allowRetry: boolean): void {
			void (async (): Promise<void> => {
				const fetched = await Effect.runPromise(fetchItemTagsEffect(itemType, stableItemId));
				if (!isActive) {
					return;
				}
				originalTagsRef.current = fetched;
				if (!hasLocalTagEditsRef.current) {
					currentTagsRef.current = fetched;
					setTagsInternal(fetched);
				}
				setIsLoadingTags(false);
				if (
					allowRetry &&
					fetched.length === ZERO_TAGS &&
					!hasLocalTagEditsRef.current &&
					retryTimeoutId === undefined
				) {
					retryTimeoutId = setTimeout(() => {
						retryTimeoutId = undefined;
						loadTags(false);
					}, TAG_FETCH_RETRY_DELAY_MS);
				}
			})();
		}

		loadTags(true);

		return (): void => {
			isActive = false;
			if (retryTimeoutId !== undefined) {
				clearTimeout(retryTimeoutId);
			}
		};
	}, [itemType, itemId]);

	/**
	 * Persist tag changes for the specified item id.
	 *
	 * The function sends the original tags (from mount) and the current local
	 * `tags` so the server can compute and apply the minimal update.
	 *
	 * @param id - UUID of the item to save tags for.
	 * @returns A `SaveTagsResult` indicating success or failure with an error message.
	 */
	async function saveTags(id: string): Promise<SaveTagsResult> {
		try {
			await Effect.runPromise(
				saveItemTagsEffect({
					itemType,
					itemId: id,
					originalTags: originalTagsRef.current,
					nextTags: currentTagsRef.current,
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

	return { tags, getTags, setTags, saveTags, isLoadingTags };
}
