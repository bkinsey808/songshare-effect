import { CSS } from "@dnd-kit/utilities";

import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import tw from "@/react/lib/utils/tw";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";

import DeleteConfirmationRow from "./DeleteConfirmationRow";
import SortableGridCells from "./sortable-grid-cells/SortableGridCells";
import useSlidesGridRow from "./useSlidesGridRow";

const DRAG_OPACITY = 0.5;
const NORMAL_OPACITY = 1;
const REMOVE_COUNT = 1;

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
	globalIsDragging: boolean;
	/** When true, this row is part of a duplicate set and uses a hash-of-slideId tint. */
	isDuplicateRow: boolean;
	backgroundPickerSlideId: string | undefined;
	isImageLibraryLoading: boolean;
	imageLibraryEntryList: readonly ImageLibraryEntry[];
	toggleBackgroundPicker: (slideId: string) => void;
	selectSlideBackgroundImage: (
		params: Readonly<{
			slideId: string;
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
	openChordPicker: OpenChordPicker;
}>;

/**
 * Render a single sortable song slide row.
 *
 * Handles reordering, duplication, removal, and delete confirmation for the
 * current slide row while delegating cell rendering to child components.
 *
 * @param slideId - Unique identifier for the slide.
 * @param slide - Slide data object.
 * @param fields - Dynamic field columns rendered for this row.
 * @param editSlideName - Handler that updates the slide name.
 * @param editFieldValue - Handler that updates a field value.
 * @param safeGetField - Safe accessor that returns display text for a field.
 * @param setSlideOrder - Setter for the presentation's slide order array.
 * @param slideOrder - Current slide order array, including duplicates.
 * @param duplicateSlide - Handler that duplicates the slide by id.
 * @param deleteSlide - Handler that deletes the slide record.
 * @param slides - Lookup of all slides by id.
 * @param idx - Index of this row within the slide order array.
 * @param getColumnWidth - Returns the width in pixels for a given field.
 * @param globalIsDragging - Whether any row is currently being dragged.
 * @param isDuplicateRow - Whether this row belongs to a duplicate slide group.
 * @param backgroundPickerSlideId - Currently open background picker slide id.
 * @param isImageLibraryLoading - Whether image library data is loading.
 * @param imageLibraryEntryList - Available image library entries.
 * @param toggleBackgroundPicker - Toggles the inline background picker.
 * @param selectSlideBackgroundImage - Applies a background image to the slide.
 * @param clearSlideBackgroundImage - Clears the current slide background image.
 * @param openChordPicker - Callback to open the chord picker for this row
 * @returns React element for the table row.
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
	globalIsDragging,
	isDuplicateRow,
	backgroundPickerSlideId,
	isImageLibraryLoading,
	imageLibraryEntryList,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
	openChordPicker,
}: SortableGridRowProps): ReactElement {
	const {
		confirmingDelete,
		setConfirmingDelete,
		isSingleInstance,
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		totalColumns,
		faded,
	} = useSlidesGridRow({
		slideId,
		slideOrder,
		fields,
		globalIsDragging,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? DRAG_OPACITY : NORMAL_OPACITY,
	};

	const rowClass = tw`bg-white dark:bg-gray-800`;
	const draggingClass = tw`z-10`;

	return (
		<tr
			ref={setNodeRef}
			key={`${slideId}-grid-${String(idx)}`}
			style={style}
			className={`${rowClass} ${isDragging ? draggingClass : ""}`}
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
					attributes={attributes}
					listeners={listeners}
					isDuplicateRow={isDuplicateRow}
					backgroundPickerSlideId={backgroundPickerSlideId}
					isImageLibraryLoading={isImageLibraryLoading}
					imageLibraryEntryList={imageLibraryEntryList}
					toggleBackgroundPicker={toggleBackgroundPicker}
					selectSlideBackgroundImage={selectSlideBackgroundImage}
					clearSlideBackgroundImage={clearSlideBackgroundImage}
					openChordPicker={openChordPicker}
				/>
			)}
		</tr>
	);
}
