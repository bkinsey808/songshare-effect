import { useCallback, useEffect, useRef } from "react";

type AutoExpandingTextareaProps = {
	readonly value: string;
	readonly onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	readonly placeholder?: string;
	readonly className?: string;
	readonly minRows?: number;
	readonly maxRows?: number;
};

export default function AutoExpandingTextarea({
	value,
	onChange,
	placeholder,
	className = "",
	minRows = 2,
	maxRows = 10,
}: AutoExpandingTextareaProps): ReactElement {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const adjustHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) {
			return;
		}

		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = "auto";

		// Calculate the line height
		const style = window.getComputedStyle(textarea);
		const lineHeight = parseInt(style.lineHeight, 10) || 20;

		// Calculate min and max heights
		const minHeight = lineHeight * minRows;
		const maxHeight = lineHeight * maxRows;

		// Set the height based on content, but within min/max bounds
		const newHeight = Math.min(
			Math.max(textarea.scrollHeight, minHeight),
			maxHeight,
		);
		textarea.style.height = `${newHeight}px`;

		// Show scrollbar if content exceeds maxRows
		textarea.style.overflowY =
			textarea.scrollHeight > maxHeight ? "auto" : "hidden";
	}, [minRows, maxRows]);

	// Adjust height when value changes
	useEffect(() => {
		adjustHeight();
	}, [value, adjustHeight]);

	// Adjust height on mount
	useEffect(() => {
		adjustHeight();
	}, [adjustHeight]);

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
				minHeight: `${minRows * 20}px`,
			}}
			onInput={adjustHeight}
		/>
	);
}
