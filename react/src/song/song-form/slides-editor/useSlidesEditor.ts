import { type DragEndEvent, type SensorDescriptor, type SensorOptions } from "@dnd-kit/core";
import { Effect } from "effect";
import { useEffect, useState } from "react";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
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
 * @returns Handlers and state used by slide editor views (add/delete/duplicate, reorder handlers, sensors)
 */
export default function useSlidesEditor({
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
	enableBackgroundLibrary = false,
}: Readonly<{
	slideOrder: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	slides: Readonly<Record<string, Slide>>;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	enableBackgroundLibrary?: boolean;
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
	}: Readonly<{
		slideId: string;
		backgroundImageId: string | undefined;
		backgroundImageUrl: string | undefined;
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
} {
	clientDebug("slideOrder", slideOrder);
	clientDebug("slides", slides);
	const [backgroundPickerSlideId, setBackgroundPickerSlideId] = useState<string | undefined>(
		undefined,
	);
	const fetchImageLibrary = useAppStore<() => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.fetchImageLibrary,
	);

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

	function toggleBackgroundPicker(slideId: string): void {
		setBackgroundPickerSlideId((currentValue) => (currentValue === slideId ? undefined : slideId));
	}

	function closeBackgroundPicker(): void {
		setBackgroundPickerSlideId(undefined);
	}

	function selectSlideBackgroundImage({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string;
		backgroundImageUrl: string;
	}>): void {
		editSlideBackgroundImage({
			slideId,
			backgroundImageId,
			backgroundImageUrl,
		});
		closeBackgroundPicker();
	}

	function clearSlideBackgroundImage(slideId: string): void {
		editSlideBackgroundImage({
			slideId,
			backgroundImageId: undefined,
			backgroundImageUrl: undefined,
		});
	}

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
		selectSlideBackgroundImage,
		clearSlideBackgroundImage,
	};
}
