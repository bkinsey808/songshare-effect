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
	slideIds: readonly string[];
	setSlidesOrder: (newOrder: readonly string[]) => void;
}>;

type UseGridDragAndDropReturn = {
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
};

/**
 * useGridDragAndDrop
 *
 * Custom hook to setup drag-and-drop sensors and handle reordering for the slides grid.
 *
 * Responsibilities:
 * - Create dnd-kit sensors with an activation constraint to avoid accidental drags
 * - Provide a `handleDragEnd` function that computes and emits a new slide order
 * - Expose `sortableItems` representing current slide ids for sortable contexts
 *
 * @param params.slideIds - Ordered list of slide ids to be used as sortable items
 * @param params.setSlidesOrder - Callback invoked with the new order after reordering
 * @returns An object with `sensors`, `handleDragEnd`, and `sortableItems`
 */
export default function useGridDragAndDrop({
	slideIds,
	setSlidesOrder,
}: UseGridDragAndDropParams): UseGridDragAndDropReturn {
	// Use slideIds directly as sortable items for grid - convert to mutable array
	const sortableItems = [...slideIds];

	// Drag and drop sensors - add activationConstraint to prevent accidental drags
	const DISTANCE = 8;
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				// Require DISTANCE px movement before drag starts
				distance: DISTANCE,
			},
		}),
	);

	// Handle drag end for slide order in grid
	const NOT_FOUND = -1;

	function handleDragEnd(event: DragEndEvent): void {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const slidesArray = [...slideIds];
			const activeIdStr = String(active.id);
			const overIdStr = String(over.id);
			const activeIndex = slidesArray.indexOf(activeIdStr);
			const overIndex = slidesArray.indexOf(overIdStr);

			if (activeIndex !== NOT_FOUND && overIndex !== NOT_FOUND) {
				const newOrder = arrayMove(slidesArray, activeIndex, overIndex);
				setSlidesOrder(newOrder);
			}
		}
	}

	return {
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
