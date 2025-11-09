type FormTextareaProps = Readonly<{
	name?: string;
	placeholder?: string;
	value?: string;
	onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	rows?: number;
	autoExpand?: boolean;
	className?: string;
}>;

export default function FormTextarea({
	autoExpand = false,
	className = "",
	rows = 2,
	...props
}: FormTextareaProps): ReactElement {
	const handleInput = autoExpand
		? (e: React.FormEvent<HTMLTextAreaElement>) => {
				const target = e.target as HTMLTextAreaElement;
				target.style.height = "auto";
				target.style.height = target.scrollHeight + "px";
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
