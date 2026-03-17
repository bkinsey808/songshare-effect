import type { IconProps } from "./IconProps";

/**
 * Users icon SVG component.
 *
 * @param className - Optional class names applied to the svg
 * @returns A React element rendering the users icon
 */
export default function UsersIcon({ className = "" }: IconProps): ReactElement {
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
			<path d="M16 19a4 4 0 0 0-8 0" />
			<circle cx="12" cy="9" r="3" />
			<path d="M21 19a3 3 0 0 0-3-3" />
			<path d="M18 8a2.5 2.5 0 0 0 0-5" />
			<path d="M3 19a3 3 0 0 1 3-3" />
			<path d="M6 8a2.5 2.5 0 0 1 0-5" />
		</svg>
	);
}
