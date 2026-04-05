import type { IconProps } from "./IconProps";

/**
 * Chord icon component — three note heads on a five-line staff, representing a musical chord.
 *
 * @param className - Optional classes applied to the svg
 * @returns A React element rendering the chord icon
 */
export default function ChordIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Five staff lines */}
			<line x1="2" y1="4" x2="22" y2="4" strokeWidth="1" />
			<line x1="2" y1="8" x2="22" y2="8" strokeWidth="1" />
			<line x1="2" y1="12" x2="22" y2="12" strokeWidth="1" />
			<line x1="2" y1="16" x2="22" y2="16" strokeWidth="1" />
			<line x1="2" y1="20" x2="22" y2="20" strokeWidth="1" />
			{/* Note heads on lines 1, 3, and 5 (filled to cover staff lines) */}
			<ellipse cx="9" cy="4" rx="2.5" ry="1.8" fill="currentColor" stroke="none" />
			<ellipse cx="9" cy="12" rx="2.5" ry="1.8" fill="currentColor" stroke="none" />
			<ellipse cx="9" cy="20" rx="2.5" ry="1.8" fill="currentColor" stroke="none" />
			{/* Stem */}
			<line x1="11.5" y1="2" x2="11.5" y2="20" />
		</svg>
	);
}
