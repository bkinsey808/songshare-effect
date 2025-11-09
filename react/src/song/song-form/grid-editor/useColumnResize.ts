import { useRef, useState } from "react";

type UseColumnResizeProps = Readonly<{
	fields: string[];
	defaultFieldWidth?: number;
	// w-36 = 144px
	slideNameWidth?: number;
}>;

type UseColumnResizeReturn = {
	getColumnWidth: (field: string) => number;
	isResizing: boolean;
	startResize: (field: string, startX: number) => void;
	totalWidth: number;
};

export function useColumnResize({
	fields,
	defaultFieldWidth = 200,
	slideNameWidth = 144,
}: UseColumnResizeProps): UseColumnResizeReturn {
	// Use Map for safer key handling
	const [columnWidths, setColumnWidths] = useState<Map<string, number>>(() => {
		const widthsMap = new Map<string, number>();
		for (const field of fields) {
			widthsMap.set(field, defaultFieldWidth);
		}
		return widthsMap;
	});

	const [isResizing, setIsResizing] = useState(false);
	const resizingField = useRef<string | undefined>(undefined);
	const startX = useRef<number>(0);
	const startWidth = useRef<number>(0);

	const cleanup = useRef<() => void>(() => {});

	const handleMouseMove = (event: MouseEvent) => {
		if (resizingField.current === undefined) {
			return;
		}

		const deltaX = event.clientX - startX.current;
		// Minimum width of 80px
		const newWidth = Math.max(80, startWidth.current + deltaX);
		const currentField = resizingField.current;

		setColumnWidths((prev) => {
			const newMap = new Map(prev);
			newMap.set(currentField, newWidth);
			return newMap;
		});
	};

	const handleMouseUp = () => {
		setIsResizing(false);
		resizingField.current = undefined;
		cleanup.current();
	};

	const startResize = (field: string, clientX: number) => {
		setIsResizing(true);
		resizingField.current = field;
		startX.current = clientX;

		const fieldWidth = columnWidths.get(field);
		startWidth.current = fieldWidth ?? defaultFieldWidth;

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		cleanup.current = () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	};

	const getColumnWidth = (field: string): number => {
		const fieldWidth = columnWidths.get(field);
		return fieldWidth ?? defaultFieldWidth;
	};

	// Calculate total width including slide name column
	const totalWidth =
		slideNameWidth +
		Array.from(columnWidths.values()).reduce((sum, width) => sum + width, 0);

	return {
		getColumnWidth,
		isResizing,
		startResize,
		totalWidth,
	};
}
