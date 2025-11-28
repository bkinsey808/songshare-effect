import { type ReactNode } from "react";

type FormSectionProps = Readonly<{
	children: ReactNode;
	className?: string;
}>;

export default function FormSection({
	children,
	className = "",
}: Readonly<FormSectionProps>): ReactElement {
	return <div className={`flex flex-col gap-6 ${className}`}>{children}</div>;
}
