import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";

import useSlidesEditor from "../slides-editor/useSlidesEditor";
import { type Slide } from "../songTypes";
import ResizeHandle from "./ResizeHandle";
import SortableGridRow from "./SortableGridRow";
import { useColumnResize } from "./useColumnResize";
import { useGridDragAndDrop } from "./useGridDragAndDrop";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";
import { safeGet } from "@/shared/utils/safe";

type SlidesGridViewProps = Readonly<
	ReadonlyDeep<{
		readonly fields: string[];
		readonly slideOrder: ReadonlyArray<string>;
		readonly setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
		slides: Readonly<Record<string, Slide>>;
		setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	}>
>;

export default function SlidesGridView({
	fields,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: SlidesGridViewProps): ReactElement {
	const { t } = useTranslation();

	const {
		addSlide,
		deleteSlide,
		duplicateSlide,
		editFieldValue,
		editSlideName,
		safeGetField,
	} = useSlidesEditor({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
	});

	// Use slideOrder to maintain the same order as Slides View, including duplicates
	const gridSlideOrder = slideOrder;

	// Drag and drop functionality for grid ordering
	const { sensors, handleDragEnd, sortableItems } = useGridDragAndDrop({
		slideIds: gridSlideOrder,
		setSlidesOrder: (newOrder) => {
			// Update the slideOrder to match the new grid order
			setSlideOrder(newOrder);
		},
	});

	// Column resizing functionality
	const { getColumnWidth, isResizing, startResize, totalWidth } =
		useColumnResize({
			fields,
			defaultFieldWidth: 300,
			slideNameWidth: 144,
		});

	return (
		<div className="w-full">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-xl font-bold">Slides Grid View</h2>
				<button
					type="button"
					onClick={addSlide}
					className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					title="Add New Slide"
					aria-label="Add New Slide"
				>
					<span>➕</span>
					<span>Add New Slide</span>
				</button>
			</div>

			{/* Horizontal scroll container */}
			<div
				className="overflow-x-auto"
				style={{
					maxWidth: "100%",
					overflowX: totalWidth > 1000 ? "scroll" : "auto",
				}}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<table
						className="min-w-full border-collapse border border-gray-300"
						style={{ minWidth: `${totalWidth}px` }}
					>
						<thead className="bg-gray-50">
							<tr>
								{/* Fixed Slide Name Column */}
								<th
									className="relative border border-gray-300 px-4 py-2 text-left font-semibold"
									style={{
										width: "144px",
										minWidth: "144px",
										maxWidth: "144px",
									}}
								>
									Slide Name
								</th>
								{/* Resizable Field Columns */}
								{fields.map((field) => (
									<th
										key={field}
										className="relative border border-gray-300 px-4 py-2 text-left font-semibold"
										style={{
											width: `${getColumnWidth(field)}px`,
											minWidth: `${getColumnWidth(field)}px`,
											maxWidth: `${getColumnWidth(field)}px`,
										}}
									>
										{t(`song.${field}`, field)}
										{/* Resize Handle */}
										<ResizeHandle
											field={field}
											onStartResize={startResize}
											isResizing={isResizing}
										/>
									</th>
								))}
							</tr>
						</thead>
						<SortableContext items={sortableItems}>
							<tbody>
								{gridSlideOrder.map((slideId, idx) => {
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

				{gridSlideOrder.length === 0 && (
					<div className="mt-8 text-center text-gray-500">
						<p>No slides yet. Click "Add New Slide" to get started.</p>
					</div>
				)}
			</div>

			{/* Presentation Order Info */}
			{slideOrder.length > 0 && (
				<div className="mt-6 rounded-lg bg-blue-50 p-4">
					<h3 className="mb-2 font-semibold text-blue-900">
						Current Presentation Order:
					</h3>
					<div className="flex flex-wrap gap-2">
						{slideOrder.map((slideId, idx) => {
							const slide = safeGet(slides, slideId);
							return (
								<span
									key={`order-${slideId}-${String(idx)}`}
									className="rounded bg-blue-200 px-2 py-1 text-sm text-blue-800"
								>
									{idx + 1}. {slide?.slide_name ?? "Unknown Slide"}
								</span>
							);
						})}
					</div>
					<p className="mt-2 text-sm text-blue-700">
						Use the Slides view to reorder or modify presentation sequence.
					</p>
				</div>
			)}
		</div>
	);
}
