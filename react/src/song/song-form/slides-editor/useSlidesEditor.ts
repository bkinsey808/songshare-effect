import { type DragEndEvent, type SensorDescriptor, type SensorOptions } from "@dnd-kit/core";
import { Effect } from "effect";
import { useEffect, useState } from "react";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import { clientDebug } from "@/react/lib/utils/clientLogger";

import { type Slide } from "../song-form-types";
import useSlideData from "./useSlideData";
import useSlideDragAndDrop from "./useSlideDragAndDrop";
import useSlideFields from "./useSlideFields";
import useSlideOrder from "./useSlideOrder";

/**
 * Composed hook that wires together slide editors, fields, order and drag/drop
 * concerns into a single editor surface API.
 *
 * @param slideOrder - Current ordered array of slide ids
 * @param setSlideOrder - Setter for the presentation order
 * @param slides - Map of slide id to `Slide` object
 * @param setSlides - Setter to update `slides`
 * @param enableBackgroundLibrary - Whether background library features should be enabled
 * @param songChords - Chord tokens defined on the song
 * @returns Handlers and state used by slide editor views (add/delete/duplicate, reorder handlers, sensors)
 */
export default function useSlidesEditor({
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
	enableBackgroundLibrary = false,
	songChords = [],
}: Readonly<{
	slideOrder: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	slides: Readonly<Record<string, Slide>>;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	enableBackgroundLibrary?: boolean;
	songChords?: readonly string[];
}>): {
	addSlide: () => void;
	deleteSlide: (slideId: string) => void;
	duplicateSlide: (slideId: string) => void;
	editFieldValue: ({
		slideId,
		field,
		value,
	}: Readonly<{
		slideId: string;
		field: string;
		value: string;
	}>) => void;
	editSlideName: ({
		slideId,
		newName,
	}: Readonly<{
		slideId: string;
		newName: string;
	}>) => void;
	editSlideBackgroundImage: ({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
		backgroundImageWidth,
		backgroundImageHeight,
		backgroundImageFocalPointX,
		backgroundImageFocalPointY,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string | undefined;
		backgroundImageUrl: string | undefined;
		backgroundImageWidth: number | undefined;
		backgroundImageHeight: number | undefined;
		backgroundImageFocalPointX: number | undefined;
		backgroundImageFocalPointY: number | undefined;
	}>) => void;
	safeGetField: (
		params: Readonly<{
			slides: Readonly<Record<string, Slide>>;
			slideId: string;
			field: string;
		}>,
	) => string;
	duplicateSlideOrder: (slideId: string) => void;
	removeSlideOrder: ({
		slideId,
		index,
	}: Readonly<{
		slideId: string;
		index?: number;
	}>) => void;
	moveSlideUp: (index: number) => void;
	moveSlideDown: (index: number) => void;
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
	backgroundPickerSlideId: string | undefined;
	toggleBackgroundPicker: (slideId: string) => void;
	closeBackgroundPicker: () => void;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	selectSlideBackgroundImage: ({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string;
		backgroundImageUrl: string;
	}>) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
	slideDetailUiState: Readonly<{
		confirmingDeleteSlideId: string | undefined;
		setConfirmingDeleteSlideId: (slideId: string | undefined) => void;
		backgroundPickerSlideId: string | undefined;
	}>;
	slideDetailActions: Readonly<{
		songChords: readonly string[];
		editSlideName: (params: Readonly<{ slideId: string; newName: string }>) => void;
		editFieldValue: (params: Readonly<{ slideId: string; field: string; value: string }>) => void;
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
} {
	clientDebug("slideOrder", slideOrder);
	clientDebug("slides", slides);
	const [backgroundPickerSlideId, setBackgroundPickerSlideId] = useState<string | undefined>(
		undefined,
	);
	const imageLibraryEntries = useAppStore((state: AppSlice) => state.imageLibraryEntries);
	const isImageLibraryLoading = useAppStore((state: AppSlice) => state.isImageLibraryLoading);
	const fetchImageLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchImageLibrary,
	);
	const imageLibraryEntryList = Object.values(imageLibraryEntries);

	// Use specialized hooks for different concerns
	const { sensors, handleDragEnd, sortableItems } = useSlideDragAndDrop({
		slideOrder,
		setSlideOrder,
	});

	const { duplicateSlideOrder, removeSlideOrder, moveSlideUp, moveSlideDown } = useSlideOrder({
		slideOrder,
		setSlideOrder,
	});

	const { addSlide, deleteSlide, duplicateSlide } = useSlideData({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
	});

	const { editFieldValue, editSlideName, editSlideBackgroundImage, safeGetField } = useSlideFields({
		slides,
		setSlides,
	});

	// Fetch image-library data when the slide editor enables background image selection.
	useEffect(() => {
		if (!enableBackgroundLibrary) {
			return;
		}
		void Effect.runPromise(fetchImageLibrary());
	}, [enableBackgroundLibrary, fetchImageLibrary]);

	/**
	 * Toggle the background picker open/closed for a given slide id.
	 *
	 * @param slideId - id of the slide to toggle the picker for
	 * @returns void
	 */
	function toggleBackgroundPicker(slideId: string): void {
		setBackgroundPickerSlideId((currentValue) => (currentValue === slideId ? undefined : slideId));
	}
	/**
	 * Close the background picker if open.
	 *
	 * @returns void
	 */
	function closeBackgroundPicker(): void {
		setBackgroundPickerSlideId(undefined);
	}

	/**
	 * Select a background image for a slide and close the picker.
	 *
	 * @param slideId - id of the slide
	 * @param backgroundImageId - id of the chosen background image
	 * @param backgroundImageUrl - url of the chosen image
	 * @returns void
	 */
	function selectSlideBackgroundImage({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string;
		backgroundImageUrl: string;
	}>): void {
		const selectedImage = imageLibraryEntries[backgroundImageId]?.image_public;
		editSlideBackgroundImage({
			slideId,
			backgroundImageId,
			backgroundImageUrl,
			backgroundImageWidth: selectedImage?.width ?? undefined,
			backgroundImageHeight: selectedImage?.height ?? undefined,
			backgroundImageFocalPointX: selectedImage?.focal_point_x ?? undefined,
			backgroundImageFocalPointY: selectedImage?.focal_point_y ?? undefined,
		});
		closeBackgroundPicker();
	}

	/**
	 * Clear the selected background image for a slide.
	 *
	 * @param slideId - id of the slide to clear background for
	 * @returns void
	 */
	function clearSlideBackgroundImage(slideId: string): void {
		editSlideBackgroundImage({
			slideId,
			backgroundImageId: undefined,
			backgroundImageUrl: undefined,
			backgroundImageWidth: undefined,
			backgroundImageHeight: undefined,
			backgroundImageFocalPointX: undefined,
			backgroundImageFocalPointY: undefined,
		});
	}

	const [confirmingDeleteSlideId, setConfirmingDeleteSlideId] = useState<string | undefined>(
		undefined,
	);
	const slideDetailUiState = {
		confirmingDeleteSlideId,
		setConfirmingDeleteSlideId,
		backgroundPickerSlideId,
	} as const;
	const slideDetailActions = {
		songChords,
		editSlideName,
		editFieldValue,
		toggleBackgroundPicker,
		selectSlideBackgroundImage,
		clearSlideBackgroundImage,
		moveSlideUp,
		moveSlideDown,
		deleteSlide,
		removeSlideOrder,
	} as const;

	return {
		addSlide,
		deleteSlide,
		duplicateSlide,
		duplicateSlideOrder,
		removeSlideOrder,
		moveSlideUp,
		moveSlideDown,
		editFieldValue,
		editSlideName,
		editSlideBackgroundImage,
		safeGetField,
		sensors,
		handleDragEnd,
		sortableItems,
		backgroundPickerSlideId,
		toggleBackgroundPicker,
		closeBackgroundPicker,
		isImageLibraryLoading,
		imageLibraryEntryList,
		selectSlideBackgroundImage,
		clearSlideBackgroundImage,
		slideDetailUiState,
		slideDetailActions,
	};
}
