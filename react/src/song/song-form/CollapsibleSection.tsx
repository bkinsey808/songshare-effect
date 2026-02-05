import { type ReactElement, type ReactNode } from "react";

type CollapsibleSectionProps = Readonly<{
	title: string;
	icon: ReactNode;
	isExpanded: boolean;
	onToggle: () => void;
	children: ReactNode;
}>;

/**
 * UI primitive that renders a titled collapsible section used by the Song form
 *
 * @param title - Section title text
 * @param icon - Icon node displayed to the left of the title
 * @param isExpanded - Whether the section is expanded
 * @param onToggle - Callback invoked when the section header is clicked
 * @param children - Section content rendered when expanded
 * @returns React element representing the collapsible section
 */
export default function CollapsibleSection({
	title,
	icon,
	isExpanded,
	onToggle,
	children,
}: CollapsibleSectionProps): ReactElement {
	return (
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
			>
				<div className="flex items-center gap-2">
					<span className="flex shrink-0 items-center text-xl [&>svg]:size-5">{icon}</span>
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
				</div>
				<svg
					className={`h-5 w-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{isExpanded && (
				<div className="border-t border-gray-200 dark:border-gray-600 p-4">{children}</div>
			)}
		</div>
	);
}
