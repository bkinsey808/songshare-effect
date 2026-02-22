import PlaylistSongDisplay from "../playlist-song-display/PlaylistSongDisplay";
import useEventPlaylistAccordion from "./useEventPlaylistAccordion";

const SONGS_NONE = 0;

type EventPlaylistAccordionProps = {
	playlistId: string;
};

/**
 * Displays a playlist in a collapsible accordion within the event view.
 * Shows the playlist name and lists all songs, with owner information for each.
 * @param props - Component props.
 * @param props.playlistId - The ID of the playlist to display.
 * @returns A React element displaying the playlist accordion.
 */
export default function EventPlaylistAccordion({
	playlistId,
}: EventPlaylistAccordionProps): ReactElement {
	const { isLoading, playlistName, songOrder, publicSongs } = useEventPlaylistAccordion(playlistId);

	if (isLoading) {
		return (
			<details className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-6">
				<summary className="cursor-pointer text-lg font-semibold text-gray-100">
					Loading playlist...
				</summary>
			</details>
		);
	}

	return (
		<details className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-6" open={false}>
			<summary className="cursor-pointer text-lg font-semibold text-gray-100 hover:text-white">
				📋 {playlistName} ({songOrder.length} songs)
			</summary>
			<div className="mt-4 space-y-2">
				{songOrder.length > SONGS_NONE ? (
					songOrder.map((songId: string, index: number) => (
						<PlaylistSongDisplay
							key={songId}
							songId={songId}
							index={index}
							publicSongs={publicSongs}
						/>
					))
				) : (
					<p className="text-gray-400">No songs in this playlist</p>
				)}
			</div>
		</details>
	);
}
