import type { IconProps } from "./IconProps";

/**
 * Icon for "create playlist" actions.
 * Combines a plus sign with a list/playlist symbol.
 * @param props - Icon props.
 * @param props.className - CSS class name.
 * @returns The create playlist icon.
 */
export default function CreatePlaylistIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Plus sign on left */}
			<path d="M8 7v10" />
			<path d="M4 12h8" />
			{/* Playlist lines on right */}
			<path d="M15 6h6" />
			<path d="M15 12h6" />
			<path d="M15 18h6" />
		</svg>
	);
}
