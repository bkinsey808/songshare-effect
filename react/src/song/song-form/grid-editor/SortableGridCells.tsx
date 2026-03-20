import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import cssVars from "@/react/lib/utils/cssVars";

import { type Slide } from "../song-form-types";
import SlideNameCell from "./SlideNameCell";

type EditSlideName = ({
	slideId,
	newName,
}: Readonly<{
	slideId: string;
	newName: string;
}>) => void;

type EditFieldValue = ({
	slideId,
	field,
	value,
}: Readonly<{
	slideId: string;
	field: string;
	value: string;
}>) => void;

type SafeSetGetField = (
	params: Readonly<{
		slides: Readonly<Record<string, Slide>>;
		slideId: string;
		field: string;
	}>,
) => string;

/**
 * Props for `SortableGridRowInner` (renders the tds inside a table row).
 *
 * - `attributes`: Draggable attributes from `useSortable` forwarded to the handle
 * - `listeners`: Listener map from `useSortable` forwarded to the handle
 * - Other props control editing, duplication, deletion, and rendering of fields
 */
type SortableGridRowInnerProps = Readonly<{
	slideId: string;
	slide: Slide;
	fields: readonly string[];
	editSlideName: EditSlideName;
	editFieldValue: EditFieldValue;
	safeGetField: SafeSetGetField;
	setSlideOrder: (newOrder: readonly string[]) => void;
	slideOrder: readonly string[];
	duplicateSlide: (slideId: string) => void;
	deleteSlide: (slideId: string) => void;
	slides: Readonly<Record<string, Slide>>;
	idx: number;
	getColumnWidth: (field: string) => number;
	attributes: DraggableAttributes;
	listeners: SyntheticListenerMap | undefined;
	confirmingDelete: boolean;
	setConfirmingDelete: (val: boolean) => void;
	globalIsDragging: boolean;
	/** When true, the slide name cell (left column) uses the duplicate tint. */
	isDuplicateRow: boolean;
}>;

/**
 * Render the editable cells for a sortable song slide row.
 *
 * Keeps the row layout focused on the table cells while the parent component
 * owns the drag and delete state.
 *
 * @param slideId - Unique identifier for the slide.
 * @param slide - Slide data object.
 * @param fields - Dynamic field columns rendered for this row.
 * @param editSlideName - Handler that updates the slide name.
 * @param editFieldValue - Handler that updates a field value.
 * @param safeGetField - Safe accessor that returns display text for a field.
 * @param setSlideOrder - Setter for the presentation's slide order array.
 * @param slideOrder - Current slide order array, including duplicates.
 * @param duplicateSlide - Handler that duplicates the slide.
 * @param deleteSlide - Handler that deletes the slide record.
 * @param slides - Lookup of all slides by id.
 * @param idx - Index of this row within the slide order array.
 * @param getColumnWidth - Returns the width in pixels for a given field.
 * @param attributes - Draggable attributes from `useSortable`.
 * @param listeners - Listener map from `useSortable`.
 * @param confirmingDelete - Whether delete confirmation UI is visible.
 * @param setConfirmingDelete - Setter that toggles delete confirmation state.
 * @param globalIsDragging - Whether any row is currently being dragged.
 * @param isDuplicateRow - Whether this row belongs to a duplicate slide group.
 * @returns React element containing the slide name and field cells.
 */
export default function SortableGridCells({
	slideId,
	slide,
	fields,
	editSlideName,
	editFieldValue,
	safeGetField,
	setSlideOrder,
	slideOrder,
	duplicateSlide,
	deleteSlide,
	slides,
	idx,
	getColumnWidth,
	attributes,
	listeners,
	confirmingDelete,
	setConfirmingDelete,
	globalIsDragging,
	isDuplicateRow,
}: SortableGridRowInnerProps): ReactElement {
	return (
		<>
			<SlideNameCell
				slideId={slideId}
				slide={slide}
				editSlideName={editSlideName}
				setSlideOrder={setSlideOrder}
				slideOrder={slideOrder}
				duplicateSlide={duplicateSlide}
				deleteSlide={deleteSlide}
				idx={idx}
				confirmingDelete={confirmingDelete}
				setConfirmingDelete={setConfirmingDelete}
				globalIsDragging={globalIsDragging}
				attributes={attributes}
				listeners={listeners}
				isDuplicateRow={isDuplicateRow}
			/>

			{/* Dynamic Field Columns with resizable widths */}
			{fields.map((field) => {
				const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
				const varName = `field-${safeName}-width`;
				// Only set the CSS custom property via inline styles; avoid direct width/minWidth/maxWidth
				const colStyle = cssVars({ [varName]: `${getColumnWidth(field)}px` });
				const tdClass = `border border-gray-300 dark:border-gray-600 p-0 group-hover:border-gray-300 dark:group-hover:border-gray-400 w-[var(--${varName})] min-w-[var(--${varName})] max-w-[var(--${varName})]`;

				// Baseline alignment: textarea padding-top = baseline-offset − textarea-baseline-correction. Browsers put the first line of a <textarea> lower than an <input> for the same padding; the correction moves this first line up so its baseline matches the slide-name input. text-base leading-normal must match SlideNameCell. Variables live on the table (SlidesGridTable).
				return (
					<td key={field} className={tdClass} style={colStyle}>
						<AutoExpandingTextarea
							value={safeGetField({ slides, slideId, field })}
							onChange={(event) => {
								editFieldValue({ slideId, field, value: event.target.value });
							}}
							className="h-full w-full border-none text-base leading-normal pt-[calc(var(--slides-grid-baseline-offset) - var(--slides-grid-textarea-baseline-correction))] px-2 pb-2 focus:outline-none text-black dark:text-white bg-transparent"
							placeholder={`Enter ${field}...`}
							minRows={2}
							maxRows={8}
						/>
					</td>
				);
			})}
		</>
	);
}
