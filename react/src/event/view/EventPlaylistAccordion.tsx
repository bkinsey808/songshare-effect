import useEventPlaylistAccordion, { usePlaylistSongDisplay } from "./useEventPlaylistAccordion";

const SONGS_NONE = 0;
const INDEX_OFFSET = 1;

type EventPlaylistAccordionProps = {
	playlistId: string;
};

type PlaylistSongDisplayProps = {
	songId: string;
	index: number;
	publicSongs: Record<string, { song_name?: string; user_id?: string; [key: string]: unknown }>;
};

/**
 * Displays a single song in the playlist accordion.
 * Fetches and shows the owner username.
 * @param props - Component props.
 * @param props.songId - The ID of the song.
 * @param props.index - The zero-based index of the song in the playlist.
 * @param props.publicSongs - Record of public songs from the app store.
 * @returns A React element displaying the song.
 */
function PlaylistSongDisplay({
	songId,
	index,
	publicSongs,
}: PlaylistSongDisplayProps): React.ReactElement {
	const { song, subText } = usePlaylistSongDisplay(songId, publicSongs);

	return (
		<div className="flex items-start gap-3 rounded bg-gray-100 px-3 py-2">
			<span className="min-w-6 text-center text-sm text-gray-500">{index + INDEX_OFFSET}</span>
			<div className="flex-1">
				<div className="font-medium text-gray-900">{song?.song_name ?? songId}</div>
				{subText && <div className="text-xs text-gray-600">{subText}</div>}
			</div>
		</div>
	);
}

/**
 * Displays a playlist in a collapsible accordion within the event view.
 * Shows the playlist name and lists all songs, with owner information for each.
 * @param props - Component props.
 * @param props.playlistId - The ID of the playlist to display.
 * @returns A React element displaying the playlist accordion.
 */
export default function EventPlaylistAccordion({
	playlistId,
}: EventPlaylistAccordionProps): React.ReactElement {
	const { isLoading, playlistName, songOrder, publicSongs } = useEventPlaylistAccordion(playlistId);

	if (isLoading) {
		return (
			<details className="mb-6 rounded-lg border border-gray-600 bg-gray-50 p-6">
				<summary className="cursor-pointer text-lg font-semibold text-gray-700">
					Loading playlist...
				</summary>
			</details>
		);
	}

	return (
		<details className="mb-6 rounded-lg border border-gray-600 bg-gray-50 p-6" open={false}>
			<summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-gray-900">
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
					<p className="text-gray-600">No songs in this playlist</p>
				)}
			</div>
		</details>
	);
}
