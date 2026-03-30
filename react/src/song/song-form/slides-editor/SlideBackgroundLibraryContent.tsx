import { useTranslation } from "react-i18next";

import getImageObjectPosition from "@/react/image/focal-point/getImageObjectPosition";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";

type SlideBackgroundLibraryContentProps = Readonly<{
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	selectedBackgroundImageId: string | undefined;
	onSelectBackgroundImage: (params: {
		backgroundImageId: string;
		backgroundImageUrl: string;
	}) => void;
	gridClassName?: string;
	imageClassName?: string;
}>;

/**
 * Renders image-library options for selecting a slide background image.
 *
 * @param isImageLibraryLoading - Whether library data is currently loading
 * @param imageLibraryEntryList - Image library entries available for selection
 * @param selectedBackgroundImageId - Currently selected image id for the slide
 * @param onSelectBackgroundImage - Callback when an image is selected
 * @param gridClassName - Optional layout override for the image grid
 * @param imageClassName - Optional size override for preview images
 * @returns React element with loading, empty state, or image grid
 */
export default function SlideBackgroundLibraryContent({
	isImageLibraryLoading,
	imageLibraryEntryList,
	selectedBackgroundImageId,
	onSelectBackgroundImage,
	gridClassName,
	imageClassName,
}: SlideBackgroundLibraryContentProps): ReactElement {
	const { t } = useTranslation();

	const FIRST_INDEX = 0;

	if (isImageLibraryLoading) {
		return (
			<p className="text-sm text-gray-400">
				{t("song.slideBackgroundImage.loadingLibrary", "Loading image library...")}
			</p>
		);
	}

	if (imageLibraryEntryList.length === FIRST_INDEX) {
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
				const isSelected =
					selectedBackgroundImageId !== undefined && selectedBackgroundImageId === image.image_id;
				return (
					<button
						type="button"
						key={entry.image_id}
						onClick={() => {
							onSelectBackgroundImage({
								backgroundImageId: image.image_id,
								backgroundImageUrl: getImagePublicUrl(image.r2_key),
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
