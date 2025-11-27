/**
 * Custom hook for managing drag and drop functionality for slides
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

type UseSlideDragAndDropParams = Readonly<{
	slideOrder: ReadonlyArray<string>;
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
}>;

type UseSlideDragAndDropReturn = {
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
};

export function useSlideDragAndDrop({
	slideOrder,
	setSlideOrder,
}: UseSlideDragAndDropParams): UseSlideDragAndDropReturn {
	const DISTANCE = 8;
	const NOT_FOUND = -1;
	// Create unique sortable IDs for each position in the array
	const sortableItems = slideOrder.map(
		(slideId, index) => `${slideId}-${String(index)}`,
	);

	// Drag and drop sensors - add activationConstraint to prevent accidental drags
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				// Require a small movement before drag starts
				distance: DISTANCE,
			},
		}),
	);

	// Handle drag end for slide order
	function handleDragEnd(event: DragEndEvent): void {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			// Extract indices from the composite IDs
			const activeIndex = sortableItems.findIndex((id) => id === active.id);
			const overIndex = sortableItems.findIndex((id) => id === over.id);

			if (activeIndex !== NOT_FOUND && overIndex !== NOT_FOUND) {
				const mutableSlideOrder = [...slideOrder];
				setSlideOrder(arrayMove(mutableSlideOrder, activeIndex, overIndex));
			}
		}
	}

	return {
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
