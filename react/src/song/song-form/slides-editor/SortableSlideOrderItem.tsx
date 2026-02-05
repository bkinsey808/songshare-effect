// src/features/song-form/SortableSlideOrderItem.tsx
import { useSortable } from "@dnd-kit/sortable";

import { ONE } from "@/shared/constants/shared-constants";

import { type Slide } from "../song-form-types";

type RemoveSlideOrder = ({
	slideId,
	index,
}: Readonly<{
	slideId: string;
	index?: number;
}>) => void;

// Sortable item for slide order
type SortableSlideOrderItemProps = Readonly<{
	slideId: string;
	sortableId: string;
	slide: Slide;
	duplicateSlideOrder: (id: string) => void;
	removeSlideOrder: RemoveSlideOrder;
	slideOrder: readonly string[];
}>;

/**
 * Sortable list item used to display an ordered slide entry inside the
 * Slide Order list. Includes controls to duplicate or remove a slide from the order.
 *
 * @param slideId - Unique id of the slide
 * @param sortableId - Composite id used by dnd-kit sortable list
 * @param slide - Slide data for rendering
 * @param duplicateSlideOrder - Callback to duplicate the slide in the order
 * @param removeSlideOrder - Callback to remove a slide from the order
 * @param slideOrder - Current order array (used to disable remove when only one)
 * @returns React element representing the sortable row
 */
export default function SortableSlideOrderItem({
	slideId,
	sortableId,
	slide,
	duplicateSlideOrder,
	removeSlideOrder,
	slideOrder,
}: SortableSlideOrderItemProps): ReactElement {
	const OPACITY_DRAGGING = 0.5;
	const OPACITY_DEFAULT = 1;
	const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
		id: sortableId,
	});

	return (
		<li
			ref={setNodeRef}
			style={{
				cursor: "grab",
				opacity: isDragging ? OPACITY_DRAGGING : OPACITY_DEFAULT,
				transform: transform
					? `translate(${String(transform.x)}px, ${String(transform.y)}px)`
					: undefined,
				transition,
			}}
			className="mb-2 flex items-center rounded bg-gray-100 px-2 py-1"
			{...attributes}
			{...listeners}
		>
			<span className="mr-2 flex-1">{slide.slide_name}</span>
			<button
				type="button"
				className="ml-2 rounded bg-blue-600 px-3 py-1 font-semibold text-white shadow transition-colors duration-150 hover:bg-blue-700"
				onPointerDown={(event) => {
					event.stopPropagation();
				}}
				onClick={() => {
					duplicateSlideOrder(slideId);
				}}
			>
				Duplicate
			</button>
			<button
				type="button"
				className="ml-2 rounded bg-red-600 px-3 py-1 font-semibold text-white shadow transition-colors duration-150 hover:bg-red-700"
				onPointerDown={(event) => {
					event.stopPropagation();
				}}
				onClick={() => {
					removeSlideOrder({ slideId });
				}}
				disabled={slideOrder.length === ONE}
			>
				Remove
			</button>
		</li>
	);
}
