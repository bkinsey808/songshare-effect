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

export default function FormInput(props: Readonly<FormInputProps>): ReactElement {
	const { className = "", ...restProps } = props;
	return <input {...restProps} className={`w-full rounded border px-2 py-1 ${className}`} />;
}
