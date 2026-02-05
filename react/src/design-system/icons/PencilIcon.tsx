import type { IconProps } from "./IconProps";

/**
 * Pencil (edit) icon component.
 *
 * @param className - Optional classes applied to the svg
 * @returns A React element rendering the pencil icon
 */
export default function PencilIcon({ className = "" }: IconProps): ReactElement {
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
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
		</svg>
	);
}
