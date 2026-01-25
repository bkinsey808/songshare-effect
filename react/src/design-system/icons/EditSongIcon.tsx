import type { IconProps } from "./IconProps";

/** Icon for “edit song” actions. Use for song-specific edit entry points (playlists and other edits use different icons). */
export default function EditSongIcon({ className = "" }: IconProps): ReactElement {
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
			{/* Pencil: scaled to fit left of note, same shape as PencilIcon */}
			<g transform="translate(0,3) scale(0.6)">
				<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
			</g>
			{/* Single note: stem, eighth-note flag at top, and note head (same as CreateSongIcon) */}
			<path d="M20 4v13" />
			<path d="M20 4q4 1 3 6" />
			<circle cx="17" cy="17" r="3" />
		</svg>
	);
}
