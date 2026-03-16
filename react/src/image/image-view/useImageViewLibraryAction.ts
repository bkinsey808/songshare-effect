import { Effect } from "effect";
import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";

export type UseImageViewLibraryActionReturn = {
	handleAdd: () => Promise<void>;
	handleRemove: () => Promise<void>;
	isPending: boolean;
	showAdd: boolean;
	showRemove: boolean;
};

export default function useImageViewLibraryAction(
	imageId: string,
	imageOwnerId: string,
): UseImageViewLibraryActionReturn {
	const [isPending, setIsPending] = useState(false);

	const currentUserId = useAppStore((state) => state.userSessionData?.user?.user_id);
	const imageLibraryEntries = useAppStore((state) => state.imageLibraryEntries ?? {}) ?? {};
	const inLibrary = imageId in imageLibraryEntries;
	const isImageLibraryLoading = useAppStore((state) => state.isImageLibraryLoading);
	const addImageToLibrary = useAppStore((state) => state.addImageToLibrary);
	const removeImageFromLibrary = useAppStore((state) => state.removeImageFromLibrary);
	const fetchImageLibrary = useAppStore((state) => state.fetchImageLibrary);

	// Ensure library is loaded when logged in so we can accurately determine in-library status
	useEffect(() => {
		if (currentUserId !== undefined && imageId !== undefined) {
			void (async (): Promise<void> => {
				try {
					await Effect.runPromise(fetchImageLibrary());
				} catch {
					/* non-fatal; button will use whatever state we have */
				}
			})();
		}
	}, [currentUserId, imageId, fetchImageLibrary]);

	const isOwner = currentUserId !== undefined && currentUserId === imageOwnerId;

	const showAdd = currentUserId !== undefined && !isImageLibraryLoading && !inLibrary;
	const showRemove = currentUserId !== undefined && !isImageLibraryLoading && inLibrary && !isOwner;

	async function handleAdd(): Promise<void> {
		setIsPending(true);
		try {
			await Effect.runPromise(
				addImageToLibrary({
					image_id: imageId,
				}),
			);
		} catch {
			/* error surfaced via store */
		}
		setIsPending(false);
	}

	async function handleRemove(): Promise<void> {
		setIsPending(true);
		try {
			await Effect.runPromise(removeImageFromLibrary({ image_id: imageId }));
		} catch {
			/* error surfaced via store */
		}
		setIsPending(false);
	}

	return {
		handleAdd,
		handleRemove,
		isPending,
		showAdd,
		showRemove,
	};
}
