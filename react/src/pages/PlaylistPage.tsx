import PlaylistView from "@/react/playlist/view/PlaylistView";

/**
 * Page component for viewing a playlist by slug.
 *
 * Delegates to PlaylistView for the actual rendering and logic.
 *
 * @returns The playlist view page
 */
export default function PlaylistPage(): ReactElement {
	return <PlaylistView />;
}
