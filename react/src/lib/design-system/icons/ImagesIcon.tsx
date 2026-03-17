import type { IconProps } from "./IconProps";

/**
 * Images icon SVG component.
 *
 * @param className - Optional class names applied to the svg
 * @returns A React element rendering the images icon
 */
export default function ImagesIcon({ className = "" }: IconProps): ReactElement {
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
			<rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
			<circle cx="9" cy="10" r="1.5" />
			<path d="M21 16l-5-5-4 4-3-3-6 6" />
		</svg>
	);
}
