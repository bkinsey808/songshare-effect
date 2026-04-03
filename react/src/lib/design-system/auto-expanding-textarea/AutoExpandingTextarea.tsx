import cssVars from "@/react/lib/utils/cssVars";

import useAutoExpandingTextarea from "./useAutoExpandingTextarea";

type AutoExpandingTextareaProps = Readonly<{
	value: string;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onClick?: (event: React.MouseEvent<HTMLTextAreaElement>) => void;
	onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	onKeyUp?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	onSelect?: (event: React.SyntheticEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	className?: string;
	textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
	minRows?: number;
	maxRows?: number;
	fillParentHeight?: boolean;
	growWithContent?: boolean;
	resizeOnExternalValueChange?: boolean;
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
	onClick,
	onFocus,
	onKeyUp,
	onSelect,
	placeholder,
	className = "",
	textareaRef: externalTextareaRef,
	minRows = DEFAULT_MIN_ROWS,
	maxRows = DEFAULT_MAX_ROWS,
	fillParentHeight = false,
	growWithContent = false,
	resizeOnExternalValueChange = true,
}: AutoExpandingTextareaProps): ReactElement {
	const { textareaRef, handleFocus, handleInput } = useAutoExpandingTextarea({
		value,
		minRows,
		maxRows,
		fillParentHeight,
		growWithContent,
		resizeOnExternalValueChange,
	});

	const textareaStyle = cssVars({
		// Fallback if line height calculation fails before JS resizes the element.
		"auto-expanding-textarea-min-height": `${minRows * FALLBACK_LINE_HEIGHT}px`,
	});

	function handleTextareaRef(node: HTMLTextAreaElement | null): void {
		textareaRef.current = node;
		if (externalTextareaRef !== undefined) {
			externalTextareaRef.current = node;
		}
	}

	function handleTextareaFocus(event: React.FocusEvent<HTMLTextAreaElement>): void {
		handleFocus();
		onFocus?.(event);
	}

	return (
		<textarea
			ref={handleTextareaRef}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			className={`resize-none min-h-(--auto-expanding-textarea-min-height) ${className}`}
			style={textareaStyle}
			onFocus={handleTextareaFocus}
			onInput={handleInput}
			onClick={onClick}
			onKeyUp={onKeyUp}
			onSelect={onSelect}
		/>
	);
}
