import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactElement } from "react";

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
