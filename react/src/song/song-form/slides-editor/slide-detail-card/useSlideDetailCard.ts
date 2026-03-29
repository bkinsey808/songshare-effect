import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import hashToHue from "@/react/song/song-form/grid-editor/duplicateTint";
import { type Slide } from "@/react/song/song-form/song-form-types";
import { ONE, ZERO } from "@/shared/constants/shared-constants";
import { safeGet } from "@/shared/utils/safe";

type UseSlideDetailCardParams = Readonly<{
	slideId: string;
	idx: number;
	slideOrder: readonly string[];
	slides: Readonly<Record<string, Slide>>;
	confirmingDeleteSlideId: string | undefined;
	setConfirmingDeleteSlideId: (slideId: string | undefined) => void;
	backgroundPickerSlideId: string | undefined;
	editSlideName: (params: Readonly<{ slideId: string; newName: string }>) => void;
	editFieldValue: (
		params: Readonly<{
			slideId: string;
			field: string;
			value: string;
		}>,
	) => void;
	toggleBackgroundPicker: (slideId: string) => void;
	selectSlideBackgroundImage: (
		params: Readonly<{
			slideId: string;
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
	moveSlideUp: (index: number) => void;
	moveSlideDown: (index: number) => void;
	deleteSlide: (slideId: string) => void;
	removeSlideOrder: (params: Readonly<{ slideId: string; index?: number }>) => void;
}>;

type UseSlideDetailCardReturn = Readonly<{
	slide: Slide | undefined;
	isDuplicate: boolean;
	isConfirmingDelete: boolean;
	isBackgroundPickerOpen: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	hasMultipleSlides: boolean;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	duplicateTintProps:
		| Readonly<{
				"data-duplicate-tint": "";
				style: React.CSSProperties & Record<"--duplicate-row-hue", string>;
		  }>
		| undefined;
	onEditSlideName: (newName: string) => void;
	onEditFieldValue: (
		params: Readonly<{
			field: string;
			value: string;
		}>,
	) => void;
	onToggleBackgroundPicker: () => void;
	onSelectBackgroundImage: (
		params: Readonly<{
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	onClearSlideBackgroundImage: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onCancelDelete: () => void;
	onConfirmDelete: () => void;
	onRemoveFromPresentation: () => void;
	onRequestDelete: () => void;
}>;

/**
 * Computes card-level derived view data used by `SlideDetailCard`.
 *
 * @param slideId - Current slide id rendered by the card
 * @param slideOrder - Ordered list of slide ids used to detect duplicate placement
 * @param slides - Slide map used to resolve the current slide
 * @returns Card view-model state and conditional duplicate tint props
 */
export default function useSlideDetailCard({
	slideId,
	idx,
	slideOrder,
	slides,
	confirmingDeleteSlideId,
	setConfirmingDeleteSlideId,
	backgroundPickerSlideId,
	editSlideName,
	editFieldValue,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
	moveSlideUp,
	moveSlideDown,
	deleteSlide,
	removeSlideOrder,
}: UseSlideDetailCardParams): UseSlideDetailCardReturn {
	const imageLibraryEntries = useAppStore((state: AppSlice) => state.imageLibraryEntries);
	const isImageLibraryLoading = useAppStore((state: AppSlice) => state.isImageLibraryLoading);
	const imageLibraryEntryList = Object.values(imageLibraryEntries);
	const isDuplicate = slideOrder.filter((id) => id === slideId).length > ONE;
	const isConfirmingDelete = confirmingDeleteSlideId === slideId;
	const isBackgroundPickerOpen = backgroundPickerSlideId === slideId;
	const canMoveUp = idx !== ZERO;
	const canMoveDown = idx !== slideOrder.length - ONE;
	const hasMultipleSlides = slideOrder.length > ONE;
	const slide = safeGet(slides, slideId);
	const duplicateTintProps = isDuplicate
		? {
				"data-duplicate-tint": "" as const,
				style: {
					"--duplicate-row-hue": `${hashToHue(slideId)}`,
				} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
			}
		: undefined;

	/**
	 * Updates the current slide name.
	 *
	 * @param newName - New slide name entered by the user
	 * @returns Nothing
	 */
	function onEditSlideName(newName: string): void {
		editSlideName({ slideId, newName });
	}

	/**
	 * Updates one editable field value on the current slide.
	 *
	 * @param params - Field key and value payload from textarea change
	 * @returns Nothing
	 */
	function onEditFieldValue({
		field,
		value,
	}: Readonly<{
		field: string;
		value: string;
	}>): void {
		editFieldValue({ slideId, field, value });
	}

	/**
	 * Toggles the background-image picker panel for this slide.
	 *
	 * @returns Nothing
	 */
	function onToggleBackgroundPicker(): void {
		toggleBackgroundPicker(slideId);
	}

	/**
	 * Selects a background image for this slide.
	 *
	 * @param params - Selected library image id and URL
	 * @returns Nothing
	 */
	function onSelectBackgroundImage({
		backgroundImageId,
		backgroundImageUrl,
	}: Readonly<{
		backgroundImageId: string;
		backgroundImageUrl: string;
	}>): void {
		selectSlideBackgroundImage({ slideId, backgroundImageId, backgroundImageUrl });
	}

	/**
	 * Clears the current slide background image.
	 *
	 * @returns Nothing
	 */
	function onClearSlideBackgroundImage(): void {
		clearSlideBackgroundImage(slideId);
	}

	/**
	 * Moves this slide up by one position in the presentation order.
	 *
	 * @returns Nothing
	 */
	function onMoveUp(): void {
		moveSlideUp(idx);
	}

	/**
	 * Moves this slide down by one position in the presentation order.
	 *
	 * @returns Nothing
	 */
	function onMoveDown(): void {
		moveSlideDown(idx);
	}

	/**
	 * Cancels delete confirmation for all slide cards.
	 *
	 * @returns Nothing
	 */
	function onCancelDelete(): void {
		setConfirmingDeleteSlideId(undefined);
	}

	/**
	 * Confirms deletion of this slide and closes confirmation state.
	 *
	 * @returns Nothing
	 */
	function onConfirmDelete(): void {
		deleteSlide(slideId);
		setConfirmingDeleteSlideId(undefined);
	}

	/**
	 * Removes only this occurrence from presentation order.
	 *
	 * @returns Nothing
	 */
	function onRemoveFromPresentation(): void {
		removeSlideOrder({ slideId, index: idx });
	}

	/**
	 * Starts delete confirmation mode for this slide.
	 *
	 * @returns Nothing
	 */
	function onRequestDelete(): void {
		setConfirmingDeleteSlideId(slideId);
	}

	return {
		slide,
		isDuplicate,
		isConfirmingDelete,
		isBackgroundPickerOpen,
		canMoveUp,
		canMoveDown,
		hasMultipleSlides,
		isImageLibraryLoading,
		imageLibraryEntryList,
		duplicateTintProps,
		onEditSlideName,
		onEditFieldValue,
		onToggleBackgroundPicker,
		onSelectBackgroundImage,
		onClearSlideBackgroundImage,
		onMoveUp,
		onMoveDown,
		onCancelDelete,
		onConfirmDelete,
		onRemoveFromPresentation,
		onRequestDelete,
	};
}
