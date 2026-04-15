import Button from "@/react/lib/design-system/Button";

import useImageViewLibraryAction from "./useImageViewLibraryAction";

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
 *
 * @param imageId - Id of the image to operate on.
 * @param imageOwnerId - Id of the image owner, used to determine ownership.
 * @returns A `Button` React element for add/remove actions or `undefined` when no action should be shown.
 */
export default function ImageViewLibraryAction({
	imageId,
	imageOwnerId,
}: ImageViewLibraryActionProps): ReactElement | undefined {
	const { handleAdd, handleRemove, isPending, showAdd, showRemove } = useImageViewLibraryAction(
		imageId,
		imageOwnerId,
	);

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
