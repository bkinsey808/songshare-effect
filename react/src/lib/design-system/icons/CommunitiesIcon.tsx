import type { IconProps } from "./IconProps";

/**
 * Communities icon SVG component.
 *
 * @param className - Optional class names applied to the svg
 * @returns A React element rendering the communities icon
 */
export default function CommunitiesIcon({ className = "" }: IconProps): ReactElement {
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
			<circle cx="12" cy="8" r="3" />
			<path d="M6 20a6 6 0 0 1 12 0" />
			<circle cx="5" cy="11" r="2" />
			<circle cx="19" cy="11" r="2" />
			<path d="M1.5 19a4.5 4.5 0 0 1 7.5-2.5" />
			<path d="M22.5 19a4.5 4.5 0 0 0-7.5-2.5" />
		</svg>
	);
}
