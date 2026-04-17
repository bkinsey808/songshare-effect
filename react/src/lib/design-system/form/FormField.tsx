import type { ReactNode } from "react";

type FormFieldProps = Readonly<{
	label: string;
	error?: string | undefined;
	as?: "label" | "div" | "fieldset";
	children: ReactNode;
}>;

/**
 * Labeled form field wrapper that displays an optional error below the input.
 *
 * @param label - The field label text
 * @param error - Optional error message to display below the input
 * @param as - Root element type (default: "label")
 * @param children - Input element(s) to render inside the field
 * @returns A labeled form field React element
 */
export default function FormField({
	label,
	error,
	as: Component = "label",
	children,
}: Readonly<FormFieldProps>): ReactElement {
	if (Component === "fieldset") {
		return (
			<fieldset className="flex flex-col gap-1">
				<legend className="text-sm font-bold text-gray-300">{label}</legend>
				{children}
				{error !== undefined && error !== "" && <span className="text-sm text-red-600">{error}</span>}
			</fieldset>
		);
	}

	const LabelText = Component === "label" ? "span" : "label";

	return (
		<Component className="flex flex-col gap-1">
			<LabelText className="text-sm font-bold text-gray-300">{label}</LabelText>
			{children}
			{error !== undefined && error !== "" && <span className="text-sm text-red-600">{error}</span>}
		</Component>
	);
}
