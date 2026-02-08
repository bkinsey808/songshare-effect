import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import { type ReactElement } from "react";

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
 * SortableGridRowInner
 *
 * The extracted row renderer used by `SortableGridRow`. This keeps the JSX
 * focused and easier to test / maintain while the parent retains drag-related
 * state and logic.
 *
 * @param props - component props
 * @param props.slideId - Unique identifier for the slide
 * @param props.slide - Slide data object
 * @param props.fields - The dynamic field columns to render for this row
 * @param props.editSlideName - Callback to update the slide's name
 * @param props.editFieldValue - Callback to update a specific field value
 * @param props.safeGetField - Safe accessor to get field text for rendering
 * @param props.setSlideOrder - Setter for the presentation's slide order array
 * @param props.slideOrder - Current slide order array (may contain duplicates)
 * @param props.duplicateSlide - Duplicate the slide
 * @param props.deleteSlide - Delete the slide record (used when last instance is removed)
 * @param props.slides - Lookup of all slides by id
 * @param props.idx - Index of this row within the slideOrder array
 * @param props.getColumnWidth - Function that returns width (px) for a given field
 * @param props.attributes - Draggable attributes from `useSortable` (aria/role/etc.)
 * @param props.listeners - Listener map from `useSortable` (pointer/mouse/touch handlers)
 * @param props.rowRef - Ref callback to attach the sortable DOM node
 * @param props.style - Inline style with transform/transition for drag
 * @param props.isDragging - Whether this row is being dragged
 * @param props.confirmingDelete - Whether delete confirmation UI is visible
 * @param props.setConfirmingDelete - Setter to toggle delete confirmation state
 * @param props.globalIsDragging - Higher-level flag used to fade/disable controls during any drag
 * @returns React element
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
