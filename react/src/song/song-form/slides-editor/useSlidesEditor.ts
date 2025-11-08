import {
	type DragEndEvent,
	type SensorDescriptor,
	type SensorOptions,
} from "@dnd-kit/core";

import { type Slide } from "../songTypes";
import { useSlideData } from "./useSlideData";
import { useSlideDragAndDrop } from "./useSlideDragAndDrop";
import { useSlideFields } from "./useSlideFields";
import { useSlideOrder } from "./useSlideOrder";

export default function useSlidesEditor({
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: {
	slideOrder: string[];
	setSlideOrder: (newOrder: string[]) => void;
	slides: Record<string, Slide>;
	setSlides: (newSlides: Record<string, Slide>) => void;
}): {
	addSlide: () => void;
	deleteSlide: (slideId: string) => void;
	duplicateSlide: (slideId: string) => void;
	editFieldValue: ({
		slideId,
		field,
		value,
	}: {
		slideId: string;
		field: string;
		value: string;
	}) => void;
	editSlideName: ({
		slideId,
		newName,
	}: {
		slideId: string;
		newName: string;
	}) => void;
	safeGetField: (params: {
		slides: Record<string, Slide>;
		slideId: string;
		field: string;
	}) => string;
	duplicateSlideOrder: (slideId: string) => void;
	removeSlideOrder: ({
		slideId,
		index,
	}: {
		slideId: string;
		index?: number;
	}) => void;
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
} {
	// eslint-disable-next-line no-console
	console.log("slideOrder", slideOrder);
	// eslint-disable-next-line no-console
	console.log("slides", slides);

	// Use specialized hooks for different concerns
	const { sensors, handleDragEnd, sortableItems } = useSlideDragAndDrop({
		slideOrder,
		setSlideOrder,
	});

	const { duplicateSlideOrder, removeSlideOrder } = useSlideOrder({
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
		editFieldValue,
		editSlideName,
		safeGetField,
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
