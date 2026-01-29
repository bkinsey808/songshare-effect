import type { IconProps } from "./IconProps";

/** Icon for exiting full screen mode. Shows contracting arrows. */
export default function ExitFullScreenIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Top-left corner (pointing inward) */}
			<path d="M4 14h3a2 2 0 0 1 2 2v3" />
			{/* Top-right corner (pointing inward) */}
			<path d="M20 14h-3a2 2 0 0 0-2 2v3" />
			{/* Bottom-left corner (pointing inward) */}
			<path d="M4 10h3a2 2 0 0 0 2-2V5" />
			{/* Bottom-right corner (pointing inward) */}
			<path d="M20 10h-3a2 2 0 0 1-2-2V5" />
		</svg>
	);
}
