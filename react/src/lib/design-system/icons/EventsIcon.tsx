import type { IconProps } from "./IconProps";

/**
 * Events icon SVG component.
 *
 * @param className - Optional class names applied to the svg
 * @returns A React element rendering the events icon
 */
export default function EventsIcon({ className = "" }: IconProps): ReactElement {
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
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<path d="M12 14l1.2 2.4 2.8.4-2 2 0.5 2.9-2.5-1.3-2.5 1.3 0.5-2.9-2-2 2.8-.4z" />
		</svg>
	);
}
