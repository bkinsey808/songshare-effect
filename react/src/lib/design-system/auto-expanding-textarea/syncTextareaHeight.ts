type SyncTextareaHeightParams = Readonly<{
	textarea: HTMLTextAreaElement;
	minRows: number;
	maxRows: number;
	fillParentHeight: boolean;
	growWithContent: boolean;
}>;

const FALLBACK_LINE_HEIGHT = 20;
const ZERO_HEIGHT = 0;

/**
 * Recomputes a textarea's rendered height from its content, row limits, and optional parent fill.
 *
 * Updates the element in place by setting `style.height` and `style.overflowY`.
 *
 * @param textarea - textarea element whose rendered height should be synchronized
 * @param minRows - minimum visible row count to preserve
 * @param maxRows - maximum visible row count when content growth is capped
 * @param fillParentHeight - whether the textarea should grow to at least its parent height
 * @param growWithContent - whether to ignore the max row cap and expand with content
 */
export default function syncTextareaHeight({
	textarea,
	minRows,
	maxRows,
	fillParentHeight,
	growWithContent,
}: SyncTextareaHeightParams): void {
	textarea.style.height = "auto";

	const style = globalThis.getComputedStyle(textarea);
	const lineHeight = Number.parseInt(style.lineHeight, 10) || FALLBACK_LINE_HEIGHT;

	const minHeight = lineHeight * minRows;
	const maxHeight = growWithContent ? Number.POSITIVE_INFINITY : lineHeight * maxRows;
	const parentHeight = fillParentHeight
		? (textarea.parentElement?.clientHeight ?? ZERO_HEIGHT)
		: ZERO_HEIGHT;

	const newHeight = Math.min(
		Math.max(textarea.scrollHeight, minHeight, parentHeight),
		Math.max(maxHeight, parentHeight),
	);
	textarea.style.height = `${newHeight}px`;
	textarea.style.overflowY =
		!growWithContent && textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}
