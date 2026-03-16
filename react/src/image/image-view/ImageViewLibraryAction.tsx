import { Effect } from "effect";
import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/lib/design-system/Button";

type ImageViewLibraryActionProps = Readonly<{
	imageId: string;
	imageOwnerId: string;
}>;

const AddIcon = (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
		<path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const RemoveIcon = (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
		<path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * Renders an Add to Library or Remove from Library button on the image view
 * when the user is signed in and the image is not owned by them.
 *
 * - Add: shown when the image is not in the user's image library
 * - Remove: shown when the image is in the library but the user does not own it
 */
export default function ImageViewLibraryAction({
	imageId,
	imageOwnerId,
}: ImageViewLibraryActionProps): ReactElement | undefined {
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
	const showRemove =
		currentUserId !== undefined && !isImageLibraryLoading && inLibrary && !isOwner;

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

	if (showAdd) {
		return (
			<Button
				variant="outlinePrimary"
				size="compact"
				icon={AddIcon}
				disabled={isPending}
				onClick={() => void handleAdd()}
				data-testid="image-view-add-to-library"
			>
				Add to library
			</Button>
		);
	}

	if (showRemove) {
		return (
			<Button
				variant="outlineDanger"
				size="compact"
				icon={RemoveIcon}
				disabled={isPending}
				onClick={() => void handleRemove()}
				data-testid="image-view-remove-from-library"
			>
				Remove from library
			</Button>
		);
	}

	return undefined;
}
