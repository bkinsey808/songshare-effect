import type { SVGProps } from "react";

/**
 * Playlist Library icon - represents a collection of playlists.
 * @param props - SVG element properties.
 * @returns A playlist library icon component.
 */
export default function PlaylistLibraryIcon(props: SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			{/* Three stacked horizontal lines representing lists */}
			<line x1="4" y1="6" x2="14" y2="6" />
			<line x1="4" y1="10" x2="14" y2="10" />
			<line x1="4" y1="14" x2="12" y2="14" />
			{/* Music note for playlist indication */}
			<path d="M17 14v6m0 0c-1.5 0-2.5-1-2.5-2s1-2 2.5-2 2.5 1 2.5 2-1 2-2.5 2z" />
		</svg>
	);
}
