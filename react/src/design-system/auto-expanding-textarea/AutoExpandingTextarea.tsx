import { useEffect, useRef } from "react";

type AutoExpandingTextareaProps = Readonly<{
	value: string;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	className?: string;
	minRows?: number;
	maxRows?: number;
}>;

const DEFAULT_MIN_ROWS = 2;
const DEFAULT_MAX_ROWS = 10;
const FALLBACK_LINE_HEIGHT = 20;

/**
 * Auto-resizing textarea that expands and contracts between `minRows` and `maxRows`
 * based on its content. Useful for forms where a growing input area improves UX.
 *
 * @param value - Controlled textarea value
 * @param onChange - Change event handler for the textarea
 * @param placeholder - Optional placeholder text
 * @param className - Optional CSS class names to apply
 * @param minRows - Minimum number of visible rows (defaults to 2)
 * @param maxRows - Maximum number of visible rows (defaults to 10)
 * @returns React element rendering a textarea that auto-expands with content
 */
export default function AutoExpandingTextarea({
	value,
	onChange,
	placeholder,
	className = "",
	minRows = DEFAULT_MIN_ROWS,
	maxRows = DEFAULT_MAX_ROWS,
}: AutoExpandingTextareaProps): ReactElement {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Adjust height when value changes or on mount
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea === null) {
			return;
		}

		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = "auto";

		// Calculate the line height
		const style = globalThis.getComputedStyle(textarea);
		const lineHeight = Number.parseInt(style.lineHeight, 10) || FALLBACK_LINE_HEIGHT;

		// Calculate min and max heights
		const minHeight = lineHeight * minRows;
		const maxHeight = lineHeight * maxRows;

		// Set the height based on content, but within min/max bounds
		const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
		textarea.style.height = `${newHeight}px`;

		// Show scrollbar if content exceeds maxRows
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
	}, [value, minRows, maxRows]);

	// Handle input events to adjust height in real-time
	function handleInput(): void {
		const textarea = textareaRef.current;
		if (textarea === null) {
			return;
		}

		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = "auto";

		// Calculate the line height
		const style = globalThis.getComputedStyle(textarea);
		const lineHeight = Number.parseInt(style.lineHeight, 10) || FALLBACK_LINE_HEIGHT;

		// Calculate min and max heights
		const minHeight = lineHeight * minRows;
		const maxHeight = lineHeight * maxRows;

		// Set the height based on content, but within min/max bounds
		const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
		textarea.style.height = `${newHeight}px`;

		// Show scrollbar if content exceeds maxRows
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
	}

	return (
		<textarea
			ref={textareaRef}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			className={className}
			style={{
				resize: "none",
				// fallback if line height calculation fails
				minHeight: `${minRows * FALLBACK_LINE_HEIGHT}px`,
			}}
			onInput={handleInput}
		/>
	);
}
