import { type DragEndEvent, type SensorDescriptor, type SensorOptions } from "@dnd-kit/core";

import { clientDebug } from "@/react/utils/clientLogger";

import { type Slide } from "../song-form-types";
import useSlideData from "./useSlideData";
import useSlideDragAndDrop from "./useSlideDragAndDrop";
import useSlideFields from "./useSlideFields";
import useSlideOrder from "./useSlideOrder";

export default function useSlidesEditor({
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: Readonly<{
	slideOrder: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	slides: Readonly<Record<string, Slide>>;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
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
} {
	clientDebug("slideOrder", slideOrder);
	clientDebug("slides", slides);

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

	const { editFieldValue, editSlideName, safeGetField } = useSlideFields({
		slides,
		setSlides,
	});

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
		safeGetField,
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
