import type { ReactNode } from "react";

type FormFieldProps = Readonly<{
	label: string;
	error?: string | undefined;
	children: ReactNode;
}>;

export default function FormField({
	label,
	error,
	children,
}: FormFieldProps): ReactElement {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-sm font-bold text-gray-300">{label}</span>
			{children}
			{error && <span className="text-sm text-red-600">{error}</span>}
		</label>
	);
}
