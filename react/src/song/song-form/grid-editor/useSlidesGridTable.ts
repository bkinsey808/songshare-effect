import type { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";

import getDuplicateGroupMap from "./getDuplicateGroupMap";
import useColumnResize from "./useColumnResize";
import useGridDragAndDrop from "./useGridDragAndDrop";

type UseSlidesGridTableParams = Readonly<{
	fields: readonly string[];
	slideOrder: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	defaultFieldWidth: number;
	slideNameWidth: number;
}>;

type UseSlidesGridTableReturn = Readonly<{
	duplicateGroupBySlideId: Map<string, number>;
	fieldWidthVars: Record<string, string>;
	getColumnWidth: (field: Readonly<string>) => number;
	globalIsDragging: boolean;
	handleDragCancel: () => void;
	handleDragEnd: (event: DragEndEvent) => void;
	handleDragStart: () => void;
	isResizing: boolean;
	sensors: ReturnType<typeof useGridDragAndDrop>["sensors"];
	sortableItems: ReturnType<typeof useGridDragAndDrop>["sortableItems"];
	startResize: (field: Readonly<string>, startX: number) => void;
	totalWidth: number;
}>;

/**
 * Build the local state and handlers that power the slides grid table.
 *
 * @param fields - Dynamic field columns rendered in the grid.
 * @param slideOrder - Ordered list of slide ids to render and sort.
 * @param setSlideOrder - Setter for the presentation's slide order array.
 * @param defaultFieldWidth - Default width in pixels used for dynamic field columns.
 * @param slideNameWidth - Width in pixels for the fixed slide name column.
 * @returns Resize state, drag-and-drop handlers, CSS vars, and duplicate grouping metadata.
 */
export default function useSlidesGridTable({
	fields,
	slideOrder,
	setSlideOrder,
	defaultFieldWidth,
	slideNameWidth,
}: UseSlidesGridTableParams): UseSlidesGridTableReturn {
	const { getColumnWidth, isResizing, startResize, totalWidth } = useColumnResize({
		fields,
		defaultFieldWidth,
		slideNameWidth,
	});

	const fieldWidthVars: Record<string, string> = {};
	for (const field of fields) {
		const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
		fieldWidthVars[`field-${safeName}-width`] = `${getColumnWidth(field)}px`;
	}

	const { sensors, handleDragEnd: handleGridDragEnd, sortableItems } = useGridDragAndDrop({
		slideIds: slideOrder,
		setSlidesOrder: setSlideOrder,
	});

	const [globalIsDragging, setGlobalIsDragging] = useState(false);

	/**
	 * Mark global dragging state when a drag is initiated.
	 *
	 * @returns void
	 */
	function handleDragStart(): void {
		setGlobalIsDragging(true);
	}

	/**
	 * Reset global dragging state when a drag is cancelled.
	 *
	 * @returns void
	 */
	function handleDragCancel(): void {
		setGlobalIsDragging(false);
	}

	/**
	 * Finalize drag operation, clearing global state and delegating grid reordering.
	 *
	 * @param event - DnD drag end event
	 * @returns void
	 */
	function handleDragEnd(event: DragEndEvent): void {
		setGlobalIsDragging(false);
		handleGridDragEnd(event);
	}

	return {
		duplicateGroupBySlideId: getDuplicateGroupMap(slideOrder),
		fieldWidthVars,
		getColumnWidth,
		globalIsDragging,
		handleDragCancel,
		handleDragEnd,
		handleDragStart,
		isResizing,
		sensors,
		sortableItems,
		startResize,
		totalWidth,
	};
}

export type { UseSlidesGridTableParams, UseSlidesGridTableReturn };
