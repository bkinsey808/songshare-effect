import { useRef, useState } from "react";

import { ZERO } from "@/shared/constants/shared-constants";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";
const DEFAULT_FIELD_WIDTH_VALUE = 200;
const DEFAULT_SLIDE_NAME_WIDTH_VALUE = 144;
const MIN_COLUMN_WIDTH = 80;

export type UseColumnResizeProps = Readonly<{
	fields: readonly string[];
	defaultFieldWidth?: number;
	// w-36 = 144px
	slideNameWidth?: number;
}>;

export type UseColumnResizeReturn = Readonly<
	ReadonlyDeep<{
		getColumnWidth: (field: Readonly<string>) => number;
		isResizing: boolean;
		startResize: (field: Readonly<string>, startX: number) => void;
		totalWidth: number;
	}>
>;

/**
 * Build the column resize state for the slides grid table.
 *
 * @param fields - Dynamic field keys rendered as table columns.
 * @param defaultFieldWidth - Default width in pixels used for fields.
 * @param slideNameWidth - Width in pixels for the fixed slide name column.
 * @returns Resize helpers and state for the grid table columns.
 */
export default function useColumnResize({
	fields,
	defaultFieldWidth,
	slideNameWidth,
}: UseColumnResizeProps): UseColumnResizeReturn {
	const DEFAULT_FIELD_WIDTH = defaultFieldWidth ?? DEFAULT_FIELD_WIDTH_VALUE;
	const DEFAULT_SLIDE_NAME_WIDTH = slideNameWidth ?? DEFAULT_SLIDE_NAME_WIDTH_VALUE;
	// Use Map for safer key handling
	const [columnWidths, setColumnWidths] = useState<Map<string, number>>(() => {
		const widthsMap = new Map<string, number>();
		for (const field of fields) {
			widthsMap.set(field, DEFAULT_FIELD_WIDTH);
		}
		return widthsMap;
	});

	const [isResizing, setIsResizing] = useState(false);
	const resizingField = useRef<string | undefined>(undefined);
	const startX = useRef<number>(ZERO);
	const startWidth = useRef<number>(ZERO);

	const cleanup = useRef<() => void>(() => void ZERO);

	/**
	 * Mouse move handler used during column resize to update the active column width.
	 *
	 * @param event - Native mouse event from the document
	 * @returns void
	 */
	function handleMouseMove(event: MouseEvent): void {
		if (resizingField.current === undefined) {
			return;
		}

		const deltaX = event.clientX - startX.current;
		// Minimum width for a column
		const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth.current + deltaX);
		const currentField = resizingField.current;

		setColumnWidths((prev) => {
			const newMap = new Map(prev);
			newMap.set(currentField, newWidth);
			return newMap;
		});
	}


	/**
	 * Mouse up handler to finish a column resize operation and clean up listeners.
	 *
	 * @returns void
	 */
	function handleMouseUp(): void {
		setIsResizing(false);
		resizingField.current = undefined;
		cleanup.current();
	}

	/**
	 * Begin resizing the given column field from the provided client X coordinate.
	 *
	 * @param field - Field key for the column being resized
	 * @param clientX - Initial clientX where the resize started
	 * @returns void
	 */
	function startResize(field: string, clientX: number): void {
		setIsResizing(true);
		resizingField.current = field;
		startX.current = clientX;

		const fieldWidth = columnWidths.get(field);
		startWidth.current = fieldWidth ?? DEFAULT_FIELD_WIDTH;

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		cleanup.current = (): void => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}

	/**
	 * Get the current width for a named column field, falling back to the default.
	 *
	 * @param field - Field key for which to retrieve the width
	 * @returns Column width in pixels
	 */
	function getColumnWidth(field: string): number {
		const fieldWidth = columnWidths.get(field);
		return fieldWidth ?? DEFAULT_FIELD_WIDTH;
	}

	// Calculate total width including slide name column
	const totalWidth =
		DEFAULT_SLIDE_NAME_WIDTH + [...columnWidths.values()].reduce((sum, width) => sum + width, ZERO);

	return {
		getColumnWidth,
		isResizing,
		startResize,
		totalWidth,
	};
}
