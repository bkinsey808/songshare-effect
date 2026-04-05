import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import { type OpenChordPicker, type Slide } from "@/react/song/song-form/song-form-types";

import { useRef } from "react";

import SlideBackgroundImageCell from "../SlideBackgroundImageCell";
import SlideFieldCell from "../SlideFieldCell";
import SlideNameCell from "../SlideNameCell";
import useSortableGridCells from "./useSortableGridCells";

function noop(): void {
	/* no-op */
}

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
	attributes: DraggableAttributes;
	listeners: SyntheticListenerMap | undefined;
	confirmingDelete: boolean;
	setConfirmingDelete: (val: boolean) => void;
	globalIsDragging: boolean;
	/** When true, the slide name cell (left column) uses the duplicate tint. */
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
 * @param backgroundPickerSlideId - Currently open background picker slide id.
 * @param isImageLibraryLoading - Whether image library data is loading.
 * @param imageLibraryEntryList - Available image library entries.
 * @param toggleBackgroundPicker - Toggles the inline background picker.
 * @param selectSlideBackgroundImage - Applies a background image to the slide.
 * @param clearSlideBackgroundImage - Clears the current slide background image.
 * @returns React element containing the slide name and field cells.
 */
export type { SortableGridRowInnerProps };

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
	attributes,
	listeners,
	confirmingDelete,
	setConfirmingDelete,
	globalIsDragging,
	isDuplicateRow,
	backgroundPickerSlideId,
	isImageLibraryLoading,
	imageLibraryEntryList,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
	openChordPicker,
}: SortableGridRowInnerProps): ReactElement {
	const { lyricsTextareaRef, isEditingChord, hasLyrics, onSyncLyricsSelection, onOpenChordPicker } =
		useSortableGridCells({ slideId, fields, slides, safeGetField, editFieldValue, openChordPicker });

	const fallbackTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
				hasLyrics={hasLyrics}
				isEditingChord={isEditingChord}
				onOpenChordPicker={onOpenChordPicker}
			/>
			{/* Dynamic Field Columns with resizable widths */}
			{fields.map((field) => (
				<SlideFieldCell
					key={field}
					field={field}
					slideId={slideId}
					slides={slides}
					safeGetField={safeGetField}
					editFieldValue={editFieldValue}
					textareaRef={field === "lyrics" ? lyricsTextareaRef : fallbackTextareaRef}
					onSyncSelection={field === "lyrics" ? onSyncLyricsSelection : noop}
				/>
			))}
			<SlideBackgroundImageCell
				slideId={slideId}
				slide={slide}
				isBackgroundPickerOpen={backgroundPickerSlideId === slideId}
				isImageLibraryLoading={isImageLibraryLoading}
				imageLibraryEntryList={imageLibraryEntryList}
				toggleBackgroundPicker={toggleBackgroundPicker}
				selectSlideBackgroundImage={selectSlideBackgroundImage}
				clearSlideBackgroundImage={clearSlideBackgroundImage}
			/>
		</>
	);
}
