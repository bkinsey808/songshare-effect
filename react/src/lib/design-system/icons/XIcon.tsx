import type { IconProps } from "./IconProps";

/**
 * X (close) icon component.
 *
 * @param className - Optional classes applied to the svg
 * @returns A React element rendering the close (X) icon
 */
export default function XIcon({ className = "" }: IconProps): ReactElement {
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
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}
