import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// ReactElement is ambient; no import needed

import DragHandle from "@/react/song/song-form/grid-editor/DragHandle";

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

	const Z_INDEX_DRAGGING = 50;
	const OPACITY_DRAGGING = 0.5;
	const OPACITY_DEFAULT = 1;

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? Z_INDEX_DRAGGING : "auto",
		opacity: isDragging ? OPACITY_DRAGGING : OPACITY_DEFAULT,
		position: isDragging ? ("relative" as const) : undefined,
	};

	return (
		<div ref={setNodeRef} style={style} className="mb-2 touch-none">
			<PlaylistSongCard
				{...props}
				dragHandle={<DragHandle attributes={attributes} listeners={listeners} />}
			/>
		</div>
	);
}
