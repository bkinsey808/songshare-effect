import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useTranslation } from "react-i18next";

/**
 * Props for the `DragHandle` component.
 *
 * - `attributes`: The attributes object returned from dnd-kit's `useSortable`.
 *    This contains accessibility attributes (role, aria-*) and other props the
 *    library needs applied to the handle element. It is forwarded (spread)
 *    onto the rendered <div>.
 *
 * - `listeners`: The event listeners object returned from dnd-kit's
 *    `useSortable` (pointer/touch/mouse handlers). This should be spread onto
 *    the rendered <div> so that drag gestures are handled correctly.
 */
type DragHandleProps = Readonly<{
	attributes: DraggableAttributes;
	listeners: SyntheticListenerMap | undefined;
}>;

/**
 * Render the interactive drag handle used by sortable rows.
 *
 * Forwards the dnd-kit attributes and listeners onto a small grab target.
 *
 * @param attributes - Attributes object from `useSortable`.
 * @param listeners - Listener map from `useSortable`.
 * @returns React element for the drag handle.
 */
export default function DragHandle({ attributes, listeners }: DragHandleProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div
			{...attributes}
			{...listeners}
			className="flex h-8 w-8 cursor-grab items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600 active:cursor-grabbing dark:bg-gray-600 dark:hover:bg-gray-500"
			title={t("song.dragHandleTitle", "Drag to reorder")}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				className="text-white"
			>
				<path d="M3 7h18M3 12h18M3 17h18" />
			</svg>
		</div>
	);
}
