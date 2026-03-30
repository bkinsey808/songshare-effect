import { useTranslation } from "react-i18next";

import getImageObjectPosition from "@/react/image/focal-point/getImageObjectPosition";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";

type ImagePickerPopoverContentProps = Readonly<{
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	selectedImageId: string | undefined;
	onSelectImage: (params: Readonly<{ imageId: string; imageUrl: string }>) => void;
	gridClassName?: string;
	imageClassName?: string;
}>;

const EMPTY_COUNT = 0;

/**
 * Renders the loading, empty, and selectable image-grid states inside the picker popover.
 *
 * @param isImageLibraryLoading - Whether image-library data is loading
 * @param imageLibraryEntryList - Library entries available for selection
 * @param selectedImageId - Currently selected image id
 * @param onSelectImage - Called when the user selects an image
 * @param gridClassName - Optional class override for the image grid
 * @param imageClassName - Optional class override for image previews
 * @returns React element for the image picker body
 */
export default function ImagePickerPopoverContent({
	isImageLibraryLoading,
	imageLibraryEntryList,
	selectedImageId,
	onSelectImage,
	gridClassName,
	imageClassName,
}: ImagePickerPopoverContentProps): ReactElement {
	const { t } = useTranslation();

	if (isImageLibraryLoading) {
		return (
			<p className="text-sm text-gray-400">
				{t("song.slideBackgroundImage.loadingLibrary", "Loading image library...")}
			</p>
		);
	}

	if (imageLibraryEntryList.length === EMPTY_COUNT) {
		return (
			<p className="text-sm text-gray-400">
				{t("song.slideBackgroundImage.emptyLibrary", "No images in your library yet.")}
			</p>
		);
	}

	return (
		<div className={gridClassName ?? "grid grid-cols-2 gap-2 md:grid-cols-3"}>
			{imageLibraryEntryList.map((entry) => {
				const image = entry.image_public;
				if (image === undefined) {
					return undefined;
				}

				const isSelected = selectedImageId !== undefined && selectedImageId === image.image_id;
				return (
					<button
						type="button"
						key={entry.image_id}
						onClick={() => {
							onSelectImage({
								imageId: image.image_id,
								imageUrl: getImagePublicUrl(image.r2_key),
							});
						}}
						className={`overflow-hidden rounded border text-left transition-colors ${
							isSelected
								? "border-blue-400 ring-1 ring-blue-400"
								: "border-gray-700 hover:border-gray-500"
						}`}
					>
						<img
							src={getImagePublicUrl(image.r2_key)}
							alt={image.alt_text || image.image_name}
							className={imageClassName ?? "h-24 w-full object-cover"}
							style={{ objectPosition: getImageObjectPosition(image) }}
						/>
						<div className="truncate px-2 py-1 text-xs text-gray-200">{image.image_name}</div>
					</button>
				);
			})}
		</div>
	);
}
