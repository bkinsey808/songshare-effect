import type { ReactNode } from "react";

type FormFieldProps = Readonly<{
	label: string;
	error?: string | undefined;
	children: ReactNode;
}>;

/**
 * Labeled form field wrapper that displays an optional error below the input.
 *
 * @param label - The field label text
 * @param error - Optional error message to display below the input
 * @param children - Input element(s) to render inside the field
 * @returns A labeled form field React element
 */
export default function FormField({
	label,
	error,
	children,
}: Readonly<FormFieldProps>): ReactElement {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-sm font-bold text-gray-300">{label}</span>
			{children}
			{error !== undefined && error !== "" && <span className="text-sm text-red-600">{error}</span>}
		</label>
	);
}
