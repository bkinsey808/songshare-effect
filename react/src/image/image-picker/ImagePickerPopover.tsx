import { createPortal } from "react-dom";

import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import cssVars from "@/react/lib/utils/cssVars";
import ImagePickerPopoverContent from "./ImagePickerPopoverContent";
import useImagePickerPopover from "./useImagePickerPopover";

type ImagePickerPopoverProps = Readonly<{
	isOpen: boolean;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	selectedImageId: string | undefined;
	onToggle: () => void;
	onSelectImage: (params: Readonly<{ imageId: string; imageUrl: string }>) => void;
	renderTrigger: (params: Readonly<{
		triggerRef: React.RefObject<HTMLSpanElement | null>;
		isOpen: boolean;
		onToggle: () => void;
	}>) => ReactElement;
	gridClassName?: string;
	imageClassName?: string;
	popoverClassName?: string;
}>;

/**
 * Reusable floating image-library picker anchored to a trigger element.
 *
 * @param isOpen - Whether the popover is open
 * @param isImageLibraryLoading - Whether image-library data is loading
 * @param imageLibraryEntryList - Library entries available for selection
 * @param selectedImageId - Currently selected image id
 * @param onToggle - Opens or closes the picker
 * @param onSelectImage - Called when the user selects an image
 * @param renderTrigger - Render function for the anchored trigger control
 * @param gridClassName - Optional class override for the image grid
 * @param imageClassName - Optional class override for image previews
 * @param popoverClassName - Optional class override for the floating panel
 * @returns React element containing the trigger and optional portal picker
 */
export default function ImagePickerPopover({
	isOpen,
	isImageLibraryLoading,
	imageLibraryEntryList,
	selectedImageId,
	onToggle,
	onSelectImage,
	renderTrigger,
	gridClassName,
	imageClassName,
	popoverClassName,
}: ImagePickerPopoverProps): ReactElement {
	const { triggerRef, pickerRef, pickerPosition } = useImagePickerPopover({
		isOpen,
		onClose: onToggle,
	});
	const popoverPositionStyle =
		pickerPosition === undefined
			? undefined
			: cssVars({
					"image-picker-top": pickerPosition.top === undefined ? "auto" : `${pickerPosition.top}px`,
					"image-picker-bottom":
						pickerPosition.bottom === undefined ? "auto" : `${pickerPosition.bottom}px`,
					"image-picker-left": `${pickerPosition.left}px`,
					"image-picker-width": `${pickerPosition.width}px`,
					"image-picker-max-height": `${pickerPosition.maxHeight}px`,
				});

	return (
		<>
			{renderTrigger({
				triggerRef,
				isOpen,
				onToggle,
			})}
			{isOpen && pickerPosition
				? createPortal(
						<div
							ref={pickerRef}
							className={
								popoverClassName ??
								"fixed top-[var(--image-picker-top)] bottom-[var(--image-picker-bottom)] left-[var(--image-picker-left)] w-[var(--image-picker-width)] max-h-[var(--image-picker-max-height)] z-50 overflow-y-auto rounded border border-gray-600 bg-gray-900 p-3 shadow-2xl"
							}
							style={popoverPositionStyle}
						>
							<ImagePickerPopoverContent
								isImageLibraryLoading={isImageLibraryLoading}
								imageLibraryEntryList={imageLibraryEntryList}
								selectedImageId={selectedImageId}
								onSelectImage={onSelectImage}
								{...(gridClassName === undefined ? {} : { gridClassName })}
								{...(imageClassName === undefined ? {} : { imageClassName })}
							/>
						</div>,
						document.body,
					)
				: undefined}
		</>
	);
}
