import type { IconProps } from "./IconProps";

/**
 * Chevron down icon component.
 *
 * @param className - Optional classes applied to the svg
 * @returns A React element rendering the chevron down icon
 */
export default function ChevronDownIcon({ className = "" }: IconProps): ReactElement {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}
