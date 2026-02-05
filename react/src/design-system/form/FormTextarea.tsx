import React from "react";

type FormTextareaProps = Readonly<{
	name?: string;
	placeholder?: string;
	value?: string;

	onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	rows?: number;
	autoExpand?: boolean;
	className?: string;
}>;

const DEFAULT_ROWS = 2;

/**
 * A simple controlled textarea used within forms. Supports an optional
 * `autoExpand` mode that grows the textarea as the user types.
 *
 * @param autoExpand - When true, the textarea auto-expands to fit content
 * @param className - Additional CSS classes to apply
 * @param rows - Initial number of rows (defaults to 2)
 * @param props - Other native textarea props such as `value` and `onChange`
 * @returns A textarea React element suitable for form usage
 */
export default function FormTextarea({
	autoExpand = false,
	className = "",
	rows = DEFAULT_ROWS,
	...props
}: FormTextareaProps): ReactElement {
	const handleInput = autoExpand
		? (formEvent: React.FormEvent<HTMLTextAreaElement>): void => {
				const target = formEvent.currentTarget;
				target.style.height = "auto";
				target.style.height = `${target.scrollHeight}px`;
			}
		: undefined;

	return (
		<textarea
			{...props}
			rows={rows}
			className={`w-full rounded border px-2 py-1 ${autoExpand ? "resize-none overflow-hidden" : ""} ${className}`}
			onInput={handleInput}
		/>
	);
}
