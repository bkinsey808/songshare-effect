import { useRef, useState } from "react";

import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

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

export default function useColumnResize({
	fields,
	defaultFieldWidth,
	slideNameWidth,
}: UseColumnResizeProps): UseColumnResizeReturn {
	const ZERO = 0;
	const DEFAULT_FIELD_WIDTH_VALUE = 200;
	const DEFAULT_SLIDE_NAME_WIDTH_VALUE = 144;
	const MIN_COLUMN_WIDTH = 80;
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

	function handleMouseUp(): void {
		setIsResizing(false);
		resizingField.current = undefined;
		cleanup.current();
	}

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
