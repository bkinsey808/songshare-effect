/**
 * Custom hook for managing drag and drop functionality for playlist songs
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

type UsePlaylistDragAndDropParams = Readonly<{
	songOrder: readonly string[];
	setSongOrder: (newOrder: readonly string[]) => void;
}>;

type UsePlaylistDragAndDropReturn = {
	sensors: SensorDescriptor<SensorOptions>[];
	handleDragEnd: (event: DragEndEvent) => void;
	sortableItems: string[];
};

export default function usePlaylistDragAndDrop({
	songOrder,
	setSongOrder,
}: UsePlaylistDragAndDropParams): UsePlaylistDragAndDropReturn {
	const DISTANCE = 8;
	const NOT_FOUND = -1;

	// Use song IDs directly since they are unique strings in the array
	const sortableItems = [...songOrder];

	// Drag and drop sensors - add activationConstraint to prevent accidental drags
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				// Require a small movement before drag starts
				distance: DISTANCE,
			},
		}),
	);

	// Handle drag end for song order
	function handleDragEnd(event: DragEndEvent): void {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const activeId = String(active.id);
			const overId = String(over.id);

			const activeIndex = songOrder.indexOf(activeId);
			const overIndex = songOrder.indexOf(overId);

			if (activeIndex !== NOT_FOUND && overIndex !== NOT_FOUND) {
				const newOrder = arrayMove([...songOrder], activeIndex, overIndex);
				setSongOrder(newOrder);
			}
		}
	}

	return {
		sensors,
		handleDragEnd,
		sortableItems,
	};
}
