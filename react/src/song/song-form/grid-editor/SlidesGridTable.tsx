import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";

import cssVars from "@/react/utils/cssVars";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { safeGet } from "@/shared/utils/safe";

import { type Slide } from "../songTypes";
import ResizeHandle from "./ResizeHandle";
import SortableGridRow from "./SortableGridRow";
import useColumnResize from "./useColumnResize";
import useGridDragAndDrop from "./useGridDragAndDrop";

const DEFAULT_FIELD_WIDTH = 300;
const SLIDE_NAME_WIDTH = 144;
const EMPTY_COUNT = 0;

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
	return (
		<div
			className="overflow-x-auto"
			style={{
				maxWidth: "100%",
				overflowX: totalWidth > horizontalScrollThreshold ? "scroll" : "auto",
			}}
		>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<table
					className="min-w-[var(--table-min-width)] border-collapse border border-gray-300 dark:border-gray-600"
					style={cssVars({
						"slide-name-width": `${SLIDE_NAME_WIDTH}px`,
						"table-min-width": `${totalWidth}px`,
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
									<SortableGridRow
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
