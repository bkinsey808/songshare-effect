// src/features/song-form/SortableSlideOrderItem.tsx
import { useSortable } from "@dnd-kit/sortable";

import { type Slide } from "../songTypes";

// Sortable item for slide order
type SortableSlideOrderItemProps = {
	slideId: string;
	sortableId: string;
	slide: Slide;
	duplicateSlideOrder: (id: string) => void;
	removeSlideOrder: ({
		slideId,
		index,
	}: {
		slideId: string;
		index?: number;
	}) => void;
	slideOrder: string[];
};

export default function SortableSlideOrderItem(
	props: Readonly<SortableSlideOrderItemProps>,
): ReactElement {
	const {
		slideId,
		sortableId,
		slide,
		duplicateSlideOrder,
		removeSlideOrder,
		slideOrder,
	} = props;
	const {
		attributes,
		listeners,
		setNodeRef,
		isDragging,
		transform,
		transition,
	} = useSortable({ id: sortableId });

	return (
		<li
			ref={setNodeRef}
			style={{
				cursor: "grab",
				opacity: isDragging ? 0.5 : 1,
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
				disabled={slideOrder.length === 1}
			>
				Remove
			</button>
		</li>
	);
}
