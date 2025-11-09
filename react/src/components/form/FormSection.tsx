type FormSectionProps = Readonly<{
	children: React.ReactNode;
	className?: string;
}>;

export default function FormSection({
	children,
	className = "",
}: FormSectionProps): ReactElement {
	return <div className={`flex flex-col gap-6 ${className}`}>{children}</div>;
}
