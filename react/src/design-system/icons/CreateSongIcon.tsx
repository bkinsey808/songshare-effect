import type { IconProps } from "./IconProps";

/** Icon for “create song” actions. Use for song-specific create entry points (playlists and other creates use different icons).


 * Create song icon component.
 *
 * @param className - Optional classes applied to the svg
 * @returns A React element rendering the create-song icon
 */
export default function CreateSongIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Plus: slightly smaller, left of center */}
			<path d="M8 7v10" />
			<path d="M4 12h8" />
			{/* Single note: stem, eighth-note flag at top, and note head */}
			<path d="M20 4v13" />
			<path d="M20 4q4 1 3 6" />
			<circle cx="17" cy="17" r="3" />
		</svg>
	);
}
