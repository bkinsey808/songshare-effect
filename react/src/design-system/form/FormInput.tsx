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
 * A lightweight wrapper around a native `<input>` used in forms. Applies
 * consistent styling and forwards native input props and ref attributes.
 *
 * @param props - Standard input props (type, name, value, event handlers) and optional ref
 * @returns A styled input element suitable for use in forms
 */
export default function FormInput(props: Readonly<FormInputProps>): ReactElement {
	const { className = "", ...restProps } = props;
	return <input {...restProps} className={`w-full rounded border px-2 py-1 ${className}`} />;
}
