import type { ReactNode } from "react";

type FormSectionProps = Readonly<{
	children: ReactNode;
	className?: string;
}>;

/**
 * Wrapper for grouping form controls into a section with vertical spacing.
 *
 * @param children - The content of the form section (inputs, labels, etc.)
 * @param className - Optional additional classes to apply to the container
 * @returns A div element that groups form elements with standard spacing
 */
export default function FormSection({
	children,
	className = "",
}: Readonly<FormSectionProps>): ReactElement {
	return <div className={`flex flex-col gap-6 ${className}`}>{children}</div>;
}
