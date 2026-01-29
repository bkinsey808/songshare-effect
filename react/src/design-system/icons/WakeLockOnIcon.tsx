import type { IconProps } from "./IconProps";

/** Icon for wake lock enabled - shows an eye that is open/awake. */
export default function WakeLockOnIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Eye outline */}
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
			{/* Pupil */}
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}
