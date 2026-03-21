import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import fetchImagesByTagRequest from "@/react/tag-library/image/fetchImagesByTagRequest";

export type UseTagViewReturn = {
	currentUserId: string | undefined;
	entries: ImageLibraryEntry[];
	error: string | undefined;
	isLoading: boolean;
	tag_slug: string | undefined;
};

/**
 * Fetches images for the tag slug in the current route.
 *
 * @returns Loading, error, entries, and tag slug state.
 */
export default function useTagView(): UseTagViewReturn {
	const { tag_slug } = useParams<{ tag_slug: string }>();
	const currentUserId = useCurrentUserId();
	const [entries, setEntries] = useState<ImageLibraryEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	// Fetch images for the tag slug whenever it changes.
	useEffect(() => {
		if (tag_slug === undefined) {
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setError(undefined);
		void (async (): Promise<void> => {
			const result = await fetchImagesByTagRequest(tag_slug);
			if (result.ok) {
				setEntries(result.entries);
			} else {
				setError(result.error);
			}
			setIsLoading(false);
		})();
	}, [tag_slug]);

	return { currentUserId, entries, error, isLoading, tag_slug };
}
