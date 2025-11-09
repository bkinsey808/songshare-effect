/**
 * Custom hook for managing drag and drop functionality for grid view slides
 */
import {
	type DragEndEvent,
	PointerSensor,
	type SensorDescriptor,
	type SensorOptions,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

type UseGridDragAndDropParams = Readonly<{
	slideIds: ReadonlyArray<string>;
	setSlidesOrder: (newOrder: ReadonlyArray<string>) => void;
}>;

type UseGridDragAndDropReturn = {
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
};

export function useGridDragAndDrop({
	slideIds,
	setSlidesOrder,
}: UseGridDragAndDropParams): UseGridDragAndDropReturn {
	// Use slideIds directly as sortable items for grid - convert to mutable array
	const sortableItems = [...slideIds];

	// Drag and drop sensors - add activationConstraint to prevent accidental drags
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				// Require 8px movement before drag starts
				distance: 8,
			},
		}),
	);

	// Handle drag end for slide order in grid
	const handleDragEnd = (event: DragEndEvent): void => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const slidesArray = [...slideIds];
			const activeIndex = slidesArray.indexOf(active.id as string);
			const overIndex = slidesArray.indexOf(over.id as string);

			if (activeIndex !== -1 && overIndex !== -1) {
				const newOrder = arrayMove(slidesArray, activeIndex, overIndex);
				setSlidesOrder(newOrder);
			}
		}
	};

	return {
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
