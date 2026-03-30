import { useTranslation } from "react-i18next";

import ImagePickerPopover from "@/react/image/image-picker/ImagePickerPopover";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import Button from "@/react/lib/design-system/Button";
import { type Slide } from "@/react/song/song-form/song-form-types";

type SlideBackgroundImageCellProps = Readonly<{
	slideId: string;
	slide: Slide;
	isBackgroundPickerOpen: boolean;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	toggleBackgroundPicker: (slideId: string) => void;
	selectSlideBackgroundImage: (
		params: Readonly<{
			slideId: string;
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
}>;

/**
 * Renders the slide background preview and inline library controls inside the grid.
 *
 * @param slideId - Current slide id
 * @param slide - Slide data for this row
 * @param isBackgroundPickerOpen - Whether the image picker is expanded
 * @param isImageLibraryLoading - Whether image library data is loading
 * @param imageLibraryEntryList - Available image-library entries
 * @param toggleBackgroundPicker - Toggles the image picker for this slide
 * @param selectSlideBackgroundImage - Applies the selected image to this slide
 * @param clearSlideBackgroundImage - Removes the selected image from this slide
 * @returns React element for the background-image cell
 */
export default function SlideBackgroundImageCell({
	slideId,
	slide,
	isBackgroundPickerOpen,
	isImageLibraryLoading,
	imageLibraryEntryList,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
}: SlideBackgroundImageCellProps): ReactElement {
	const { t } = useTranslation();
	const hasBackgroundImage = slide.background_image_url !== undefined;

	function handleToggleBackgroundPicker(): void {
		toggleBackgroundPicker(slideId);
	}

	function handleClearBackgroundImage(): void {
		clearSlideBackgroundImage(slideId);
	}

	function handleSelectBackgroundImage({
		imageId,
		imageUrl,
	}: Readonly<{
		imageId: string;
		imageUrl: string;
	}>): void {
		selectSlideBackgroundImage({
			slideId,
			backgroundImageId: imageId,
			backgroundImageUrl: imageUrl,
		});
	}

	return (
		<td className="w-(--slide-background-width) min-w-(--slide-background-width) max-w-(--slide-background-width) border border-gray-300 p-2 align-top dark:border-gray-600">
			<div className="space-y-2">
				{hasBackgroundImage ? (
					<div className="overflow-hidden rounded border border-gray-600 bg-gray-900">
						<img
							src={slide.background_image_url}
							alt={t("song.slideBackgroundImage.previewAlt", "Slide background preview")}
							className="h-24 w-full object-cover"
						/>
					</div>
				) : (
					<div className="rounded border border-dashed border-gray-600 px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
						{t("song.slideBackgroundImage.none", "No background image selected")}
					</div>
				)}
				<div className="flex flex-nowrap items-center gap-2">
					<ImagePickerPopover
						isOpen={isBackgroundPickerOpen}
						isImageLibraryLoading={isImageLibraryLoading}
						imageLibraryEntryList={imageLibraryEntryList}
						selectedImageId={slide.background_image_id}
						onToggle={handleToggleBackgroundPicker}
						onSelectImage={handleSelectBackgroundImage}
						gridClassName="grid grid-cols-2 gap-3"
						imageClassName="h-40 w-full object-cover"
						renderTrigger={({ triggerRef, onToggle }) => (
							<span ref={triggerRef} className="inline-flex">
								<Button size="compact" variant="outlineSecondary" onClick={onToggle}>
									{t("song.slideBackgroundImage.choose", "Choose")}
								</Button>
							</span>
						)}
					/>
					<Button
						size="compact"
						variant="outlineDanger"
						disabled={!hasBackgroundImage}
						onClick={handleClearBackgroundImage}
					>
						{t("song.slideBackgroundImage.clearShort", "Clear")}
					</Button>
				</div>
			</div>
		</td>
	);
}
