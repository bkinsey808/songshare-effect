import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactElement } from "react";

import { type Slide } from "../song-form-types";
import DeleteConfirmationRow from "./DeleteConfirmationRow";
import SortableGridCells from "./SortableGridCells";

const DRAG_OPACITY = 0.5;
const NORMAL_OPACITY = 1;
const REMOVE_COUNT = 1;
const SINGLE_INSTANCE = 1;
// Number of fixed columns before the dynamic fields (slide name column)
const SLIDE_NAME_COL_COUNT = 1;

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

type SortableGridRowProps = Readonly<{
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
	globalIsDragging: boolean;
}>;

/**
 * SortableGridRow
 *
 * Renders a single row in the slides grid editor. Supports reordering via drag
 * and drop, duplicating, removing an instance from the presentation, and
 * deleting the slide (with confirmation when deleting the last instance).
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
 * @param props.duplicateSlide - Duplicate the slide by id
 * @param props.deleteSlide - Delete the slide record
 * @param props.slides - Lookup of all slides by id
 * @param props.idx - Index of this row within the slideOrder array
 * @param props.getColumnWidth - Function that returns width (px) for a given field
 * @param props.globalIsDragging - Higher-level flag used to fade/disable controls during any drag
 * @returns ReactElement
 */
export default function SlidesGridRow({
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
	globalIsDragging,
}: SortableGridRowProps): ReactElement {
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const instancesCount = slideOrder.filter((id) => id === slideId).length;
	const isSingleInstance = instancesCount === SINGLE_INSTANCE;
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: slideId,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? DRAG_OPACITY : NORMAL_OPACITY,
	};

	// Compute total columns safely — guard against unexpected non-array `fields` which can lead to NaN colSpan
	const BASE_FIELDS_LENGTH = 0;
	const safeFieldsLength = Array.isArray(fields) ? fields.length : BASE_FIELDS_LENGTH;
	if (!Array.isArray(fields)) {
		// Log diagnostic info in development to help track down the root cause
		// eslint-disable-next-line no-console
		console.error("SortableGridRow: unexpected fields value (expected array)", { fields });
	}
	const totalColumns = SLIDE_NAME_COL_COUNT + safeFieldsLength;

	// Render a single <tr> for both normal and delete-confirmation states.
	const faded = isSingleInstance && confirmingDelete ? Boolean(globalIsDragging) : false;

	return (
		<tr
			ref={setNodeRef}
			key={`${slideId}-grid-${String(idx)}`}
			style={style}
			className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${isDragging ? "z-10" : ""}`}
			aria-hidden={faded ? "true" : "false"}
		>
			{isSingleInstance && confirmingDelete ? (
				<DeleteConfirmationRow
					colSpan={totalColumns}
					isFaded={faded}
					onCancel={() => {
						setConfirmingDelete(false);
					}}
					onConfirm={() => {
						const newSlideOrder = [...slideOrder];
						newSlideOrder.splice(idx, REMOVE_COUNT);
						setSlideOrder(newSlideOrder);
						deleteSlide(slideId);
						setConfirmingDelete(false);
					}}
				/>
			) : (
				<SortableGridCells
					globalIsDragging={globalIsDragging}
					confirmingDelete={confirmingDelete}
					setConfirmingDelete={setConfirmingDelete}
					slideId={slideId}
					slide={slide}
					fields={fields}
					editSlideName={editSlideName}
					editFieldValue={editFieldValue}
					safeGetField={safeGetField}
					setSlideOrder={setSlideOrder}
					slideOrder={slideOrder}
					duplicateSlide={duplicateSlide}
					deleteSlide={deleteSlide}
					slides={slides}
					idx={idx}
					getColumnWidth={getColumnWidth}
					attributes={attributes}
					listeners={listeners}
				/>
			)}
		</tr>
	);
}
