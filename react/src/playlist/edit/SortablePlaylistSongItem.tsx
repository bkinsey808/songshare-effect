import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import cssVars from "@/react/lib/utils/cssVars";
import DragHandle from "@/react/song/song-form/grid-editor/grid-row/DragHandle";

import PlaylistSongCard from "./PlaylistSongCard";

type SortablePlaylistSongItemProps = {
	songId: string;
	index: number;
	totalSongs: number;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	onRemove: (songId: string) => void;
};

/**
 * Render a sortable wrapper for `PlaylistSongCard` used by the playlist editor.
 *
 * Applies drag transform and transition styles and provides a handle to the card.
 *
 * @param songId - Song id for the sortable item.
 * @param index - Zero-based index of the song.
 * @param totalSongs - Total number of songs in the playlist.
 * @param onMoveUp - Handler that moves the song up.
 * @param onMoveDown - Handler that moves the song down.
 * @param onRemove - Handler that removes the song.
 * @returns Sortable React element for the song.
 */
export default function SortablePlaylistSongItem(
	props: SortablePlaylistSongItemProps,
): ReactElement {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: props.songId,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		...cssVars({
			"drag-opacity": isDragging ? "0.5" : "1",
			"drag-z": isDragging ? "50" : "auto",
		}),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="relative mb-2 touch-none opacity-(--drag-opacity) z-(--drag-z)"
		>
			<PlaylistSongCard
				{...props}
				dragHandle={<DragHandle attributes={attributes} listeners={listeners} />}
			/>
		</div>
	);
}
