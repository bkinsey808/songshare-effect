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

/**
 * Render a lightweight styled input used in forms.
 *
 * @param className - Additional CSS classes.
 * @param restProps - Remaining props forwarded to the input element.
 * @returns A styled input element suitable for use in forms.
 */
export default function FormInput({
	className = "",
	...restProps
}: Readonly<FormInputProps>): ReactElement {
	return <input {...restProps} className={`w-full rounded border px-2 py-1 ${className}`} />;
}
