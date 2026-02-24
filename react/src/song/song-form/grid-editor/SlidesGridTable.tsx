import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import cssVars from "@/react/lib/utils/cssVars";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";
import { safeGet } from "@/shared/utils/safe";

import { type Slide } from "../song-form-types";
import ResizeHandle from "./ResizeHandle";
import SlidesGridRow from "./SlidesGridRow";
import useColumnResize from "./useColumnResize";
import useGridDragAndDrop from "./useGridDragAndDrop";

const DEFAULT_FIELD_WIDTH = 300;
const SLIDE_NAME_WIDTH = 144;
const EMPTY_COUNT = 0;
const SINGLE_OCCURRENCE = 1;

/** Build a map from slideId -> group index for slide IDs that appear more than once in order. */
function getDuplicateGroupMap(slideOrder: readonly string[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const id of slideOrder) {
		counts.set(id, (counts.get(id) ?? EMPTY_COUNT) + SINGLE_OCCURRENCE);
	}
	const map = new Map<string, number>();
	let groupIndex = EMPTY_COUNT;
	const seen = new Set<string>();
	for (const id of slideOrder) {
		if ((counts.get(id) ?? EMPTY_COUNT) > SINGLE_OCCURRENCE && !seen.has(id)) {
			seen.add(id);
			map.set(id, groupIndex);
			groupIndex += SINGLE_OCCURRENCE;
		}
	}
	return map;
}

type SlidesGridTableProps = Readonly<
	ReadonlyDeep<{
		readonly fields: readonly string[];
		readonly slideOrder: readonly string[];
		slides: Readonly<Record<string, Slide>>;
		horizontalScrollThreshold: number;

		editSlideName: ({ slideId, newName }: { slideId: string; newName: string }) => void;
		editFieldValue: ({
			slideId,
			field,
			value,
		}: {
			slideId: string;
			field: string;
			value: string;
		}) => void;
		safeGetField: ({
			slides,
			slideId,
			field,
		}: {
			slides: Readonly<Record<string, Slide>>;
			slideId: string;
			field: string;
		}) => string;
		setSlideOrder: (newOrder: readonly string[]) => void;
		duplicateSlide: (slideId: string) => void;
		deleteSlide: (slideId: string) => void;
	}>
>;

/**
 * SlidesGridTable
 *
 * Extracted table + DnD container for the Slides Grid View.
 * This component manages column resizing and DnD (drag & drop) concerns for the table.
 *
 * @param props - component props
 * @param props.fields - The dynamic field columns to render as table columns
 * @param props.slideOrder - Ordered list of slide ids to render in the table
 * @param props.slides - Lookup of slide objects by id
 * @param props.horizontalScrollThreshold - Pixel threshold to force horizontal scrolling
 * @param props.editSlideName - Callback to update a slide's name ({ slideId, newName })
 * @param props.editFieldValue - Callback to update a specific field ({ slideId, field, value })
 * @param props.safeGetField - Safe accessor to read a field value for rendering
 * @param props.setSlideOrder - Setter for the presentation's slide order array
 * @param props.duplicateSlide - Duplicate the slide by id
 * @param props.deleteSlide - Delete the slide by id
 * @returns React element rendering the slides grid table and DnD container
 */
export default function SlidesGridTable({
	fields,
	slideOrder,
	slides,
	horizontalScrollThreshold,
	editSlideName,
	editFieldValue,
	safeGetField,
	setSlideOrder,
	duplicateSlide,
	deleteSlide,
}: SlidesGridTableProps): ReactElement {
	const { t } = useTranslation();

	// Column resizing functionality — colocated with the table for easier composition
	const { getColumnWidth, isResizing, startResize, totalWidth } = useColumnResize({
		fields,
		defaultFieldWidth: DEFAULT_FIELD_WIDTH,
		slideNameWidth: SLIDE_NAME_WIDTH,
	});

	// Build CSS vars for all field widths so cells can reference them with Tailwind
	const fieldWidthVars: Record<string, string> = {};
	for (const field of fields) {
		const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
		fieldWidthVars[`field-${safeName}-width`] = `${getColumnWidth(field)}px`;
	}

	// Initialize drag-and-drop locally so this component manages DnD concerns
	const { sensors, handleDragEnd, sortableItems } = useGridDragAndDrop({
		slideIds: slideOrder,
		setSlidesOrder: (newOrder) => {
			setSlideOrder(newOrder);
		},
	});

	// Track global dragging to allow rows to cancel delete confirmations when any drag starts
	const [globalIsDragging, setGlobalIsDragging] = useState(false);

	const duplicateGroupBySlideId = getDuplicateGroupMap(slideOrder);

	function onDragEndWrapper(event: DragEndEvent): void {
		setGlobalIsDragging(false);
		handleDragEnd(event);
	}

	return (
		<div
			className="overflow-x-auto"
			style={{
				maxWidth: "100%",
				overflowX: totalWidth > horizontalScrollThreshold ? "scroll" : "auto",
			}}
		>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={() => {
					setGlobalIsDragging(true);
				}}
				onDragCancel={() => {
					setGlobalIsDragging(false);
				}}
				onDragEnd={onDragEndWrapper}
			>
				<table
					className="min-w-[var(--table-min-width)] border-collapse border border-gray-300 dark:border-gray-600"
					style={cssVars({
						"slide-name-width": `${SLIDE_NAME_WIDTH}px`,
						"table-min-width": `${totalWidth}px`,
						/*
						 * Baseline alignment: slide-name input and first line of lyrics share the same
						 * baseline. We use em so spacing scales with font-size and works across fonts.
						 *
						 * --slides-grid-baseline-offset: Distance from the row top to where the first
						 * line of text should sit. The slide-name <td> uses this as padding-top; the
						 * input uses pt-0 so its text starts at that offset. 0.25em gives a small
						 * buffer above the first line.
						 *
						 * --slides-grid-textarea-baseline-correction: <textarea> typically positions
						 * its first line lower than <input> for the same padding (browser/line-box
						 * differences). We subtract this from the baseline offset for the lyrics
						 * textarea so its first baseline lines up with the slide-name. 0.2em is an
						 * empirical correction; adjust if alignment drifts with different fonts.
						 */
						"slides-grid-baseline-offset": "0.25em",
						"slides-grid-textarea-baseline-correction": "0.2em",
						...fieldWidthVars,
					})}
				>
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr>
							{/* Fixed Slide Name Column */}
							<th className="relative border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white w-[var(--slide-name-width)] min-w-[var(--slide-name-width)] max-w-[var(--slide-name-width)]">
								{t("song.slideName", "Slide Name")}
							</th>
							{/* Resizable Field Columns */}
							{fields.map((field) => {
								const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
								const varName = `field-${safeName}-width`;
								const thStyle = cssVars({ [varName]: `${getColumnWidth(field)}px` });
								return (
									<th
										key={field}
										className={`relative border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white w-[var(--field-${safeName}-width)] min-w-[var(--field-${safeName}-width)] max-w-[var(--field-${safeName}-width)]`}
										style={thStyle}
									>
										{t(`song.${field}`, field)}
										{/* Resize Handle */}
										<ResizeHandle
											field={field}
											onStartResize={startResize}
											isResizing={isResizing}
										/>
									</th>
								);
							})}
						</tr>
					</thead>
					<SortableContext items={[...sortableItems]}>
						<tbody>
							{slideOrder.map((slideId, idx) => {
								const slide = safeGet(slides, slideId);
								if (!slide) {
									return undefined;
								}

								return (
									<SlidesGridRow
										key={`${slideId}-grid-${String(idx)}`}
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
										globalIsDragging={globalIsDragging}
										isDuplicateRow={duplicateGroupBySlideId.has(slideId)}
									/>
								);
							})}
						</tbody>
					</SortableContext>
				</table>
			</DndContext>

			{slideOrder.length === EMPTY_COUNT && (
				<div className="mt-8 text-center text-gray-500 dark:text-gray-400">
					<p>No slides yet. Click &quot;Add New Slide&quot; to get started.</p>
				</div>
			)}
		</div>
	);
}
