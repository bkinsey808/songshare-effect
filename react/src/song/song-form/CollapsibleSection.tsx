import type { ReactNode } from "react";

type CollapsibleSectionProps = Readonly<{
	title: string;
	icon: string;
	isExpanded: boolean;
	onToggle: () => void;
	children: ReactNode;
}>;

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export default function CollapsibleSection({
	title,
	icon,
	isExpanded,
	onToggle,
	children,
}: CollapsibleSectionProps): ReactElement {
	return (
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
			>
				<div className="flex items-center gap-2">
					<span className="text-xl">{icon}</span>
					<h2 className="text-lg font-semibold text-gray-900">{title}</h2>
				</div>
				<svg
					className={`h-5 w-5 transform transition-transform ${
						isExpanded ? "rotate-180" : ""
					}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{isExpanded && (
				<div className="border-t border-gray-200 p-4">{children}</div>
			)}
		</div>
	);
}
