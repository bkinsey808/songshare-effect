import usePlaylistSongDisplay from "./usePlaylistSongDisplay";

const INDEX_OFFSET = 1;

type PlaylistSongDisplayProps = {
	songId: string;
	index: number;
	publicSongs: Record<string, { song_name?: string; user_id?: string; [key: string]: unknown }>;
};

/**
 * Displays a single song row inside the event playlist accordion.
 * @param props - Component props.
 * @param props.songId - The song identifier for lookup and fallback display.
 * @param props.index - The zero-based position of the song in the playlist.
 * @param props.publicSongs - Public song records keyed by song id.
 * @returns A rendered playlist song row.
 */
export default function PlaylistSongDisplay({
	songId,
	index,
	publicSongs,
}: PlaylistSongDisplayProps): ReactElement {
	const { song, subText } = usePlaylistSongDisplay(songId, publicSongs);

	return (
		<div className="flex items-start gap-3 rounded border border-gray-700 bg-gray-800 px-3 py-2">
			<span className="min-w-6 text-center text-sm text-gray-400">{index + INDEX_OFFSET}</span>
			<div className="flex-1">
				<div className="font-medium text-gray-100">{song?.song_name ?? songId}</div>
				{subText && <div className="text-xs text-gray-400">{subText}</div>}
			</div>
		</div>
	);
}
