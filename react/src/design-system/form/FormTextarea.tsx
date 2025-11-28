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

export default function FormTextarea({
	autoExpand = false,
	className = "",
	rows = DEFAULT_ROWS,
	...props
}: FormTextareaProps): ReactElement {
	const handleInput = autoExpand
		? (formEvent: React.FormEvent<HTMLTextAreaElement>) => {
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
