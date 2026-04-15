import { useSortable } from "@dnd-kit/sortable";
import { useState } from "react";

const BASE_FIELDS_LENGTH = 0;
const FIXED_COLUMN_COUNT = 2;
const SINGLE_INSTANCE = 1;

type UseSlidesGridRowParams = Readonly<{
	slideId: string;
	slideOrder: readonly string[];
	fields: readonly string[] | undefined;
	globalIsDragging: boolean;
}>;

type UseSlidesGridRowResult = Readonly<{
	confirmingDelete: boolean;
	setConfirmingDelete: React.Dispatch<React.SetStateAction<boolean>>;
	isSingleInstance: boolean;
	attributes: ReturnType<typeof useSortable>["attributes"];
	listeners: ReturnType<typeof useSortable>["listeners"];
	setNodeRef: ReturnType<typeof useSortable>["setNodeRef"];
	transform: ReturnType<typeof useSortable>["transform"];
	transition: ReturnType<typeof useSortable>["transition"];
	isDragging: boolean;
	totalColumns: number;
	faded: boolean;
}>;

/**
 * Hook to derive draggable row state for a slide in the slides grid.
 *
 * @param slideId - The id of the slide represented by this row.
 * @param slideOrder - The full slide order array, may contain duplicates.
 * @param fields - Optional array of dynamic field keys shown for this slide.
 * @param globalIsDragging - Whether any row is currently being dragged.
 * @returns A read-only object with sortable attributes, listeners and row state.
 */
export default function useSlidesGridRow({
	slideId,
	slideOrder,
	fields,
	globalIsDragging,
}: UseSlidesGridRowParams): UseSlidesGridRowResult {
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const instancesCount = slideOrder.filter((id) => id === slideId).length;
	const isSingleInstance = instancesCount === SINGLE_INSTANCE;
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: slideId,
	});

	const safeFieldsLength = Array.isArray(fields) ? fields.length : BASE_FIELDS_LENGTH;
	if (!Array.isArray(fields)) {
		// Log diagnostic info in development to help track down the root cause.
		// oxlint-disable-next-line no-console
		console.error("SortableGridRow: unexpected fields value (expected array)", { fields });
	}

	const totalColumns = FIXED_COLUMN_COUNT + safeFieldsLength;
	const faded = isSingleInstance && confirmingDelete ? Boolean(globalIsDragging) : false;

	return {
		confirmingDelete,
		setConfirmingDelete,
		isSingleInstance,
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		totalColumns,
		faded,
	};
}

export type { UseSlidesGridRowParams };
