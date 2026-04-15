const START_OF_TEXT = 0;

/**
 * Inserts text at the current selection within a controlled textarea value.
 *
 * @param value - Current textarea value
 * @param insertion - Text to insert at the selection
 * @param selectionStart - Optional selection start index (defaults to end)
 * @param selectionEnd - Optional selection end index (defaults to `selectionStart`)
 * @returns Updated text plus the caret position after insertion
 */
export default function insertTextAtSelection({
	value,
	insertion,
	selectionStart,
	selectionEnd,
}: Readonly<{
	value: string;
	insertion: string;
	selectionStart?: number;
	selectionEnd?: number;
}>): Readonly<{
	nextValue: string;
	nextSelectionStart: number;
}> {
	const start = selectionStart ?? value.length;
	const end = selectionEnd ?? start;

	return {
		nextValue: `${value.slice(START_OF_TEXT, start)}${insertion}${value.slice(end)}`,
		nextSelectionStart: start + insertion.length,
	};
}
