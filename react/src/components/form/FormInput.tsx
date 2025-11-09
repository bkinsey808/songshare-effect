type FormInputProps = Readonly<{
	type?: "text" | "email" | "password";
	name?: string;
	placeholder?: string;
	value?: string;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: () => void;
	className?: string;
}> &
	React.RefAttributes<HTMLInputElement>;

export default function FormInput({
	className = "",
	...props
}: FormInputProps): ReactElement {
	return (
		<input
			{...props}
			className={`w-full rounded border px-2 py-1 ${className}`}
		/>
	);
}
