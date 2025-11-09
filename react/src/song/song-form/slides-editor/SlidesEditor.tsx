// src/features/song-form/SlidesEditor.tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import AutoExpandingTextarea from "../../../components/AutoExpandingTextarea";
import { type Slide } from "../songTypes";
import SortableSlideOrderItem from "./SortableSlideOrderItem";
import useSlidesEditor from "./useSlidesEditor";
import { safeGet } from "@/shared/utils/safe";

type SlidesEditorProps = Readonly<{
	fields: string[];
	// Array of slide IDs
	slideOrder: ReadonlyArray<string>;
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
	// ID -> Slide mapping
	slides: Record<string, Slide>;
	setSlides: (newSlides: Record<string, Slide>) => void;
}>;

export default function SlidesEditor({
	fields,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: SlidesEditorProps): ReactElement {
	const {
		addSlide,
		deleteSlide,
		editFieldValue,
		editSlideName,
		safeGetField,
		duplicateSlideOrder,
		removeSlideOrder,
		sensors,
		handleDragEnd,
		sortableItems,
	} = useSlidesEditor({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
	});

	return (
		<div className="w-full">
			{/* Debug output for slideOrder array */}
			<details className="mb-4 text-xs text-gray-500">
				<summary>Debug: slideOrder array</summary>
				<pre className="mt-2 rounded bg-gray-100 p-2">
					{
						// eslint-disable-next-line unicorn/no-null
						JSON.stringify(slideOrder, null, 2)
					}
				</pre>
			</details>
			<h2 className="mb-4 text-xl font-bold">Slides Order</h2>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={sortableItems}>
					<ul className="mb-6">
						{slideOrder.map((slideId, idx) => {
							const slide = safeGet(slides, slideId);
							if (!slide) {
								return <></>;
							}
							const sortableId = `${slideId}-${String(idx)}`;
							return (
								<SortableSlideOrderItem
									key={sortableId}
									slideId={slideId}
									sortableId={sortableId}
									slide={slide}
									duplicateSlideOrder={duplicateSlideOrder}
									removeSlideOrder={({
										slideId: id,
									}: Readonly<{ slideId: string }>) => {
										removeSlideOrder({ slideId: id, index: idx });
									}}
									slideOrder={slideOrder}
								/>
							);
						})}
					</ul>
				</SortableContext>
			</DndContext>
			<button
				type="button"
				onClick={addSlide}
				className="mb-8 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Add New Slide to Presentation
			</button>
			<h2 className="mb-4 text-xl font-bold">Slides</h2>
			{
				// Show all slides based on keys in the slides object
				Object.keys(slides).map((slideId, idx) => {
					const slide = safeGet(slides, slideId);
					if (!slide) {
						return <></>;
					}
					return (
						<div
							key={`${slideId}-detail-${String(idx)}`}
							className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4"
						>
							<div className="mb-2 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
								<input
									type="text"
									value={slide.slide_name}
									onChange={(event) => {
										editSlideName({ slideId, newName: event.target.value });
									}}
									className="h-[38px] min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-base"
									placeholder="Slide name"
								/>
								<div className="flex shrink-0 flex-wrap gap-2">
									<button
										className="remove-slide-btn focus:ring-opacity-50 inline-block h-[38px] rounded bg-red-600 px-4 py-1 text-base font-semibold whitespace-nowrap text-white shadow transition-colors duration-150 hover:bg-red-700 focus:ring-4 focus:outline-none"
										onClick={() => {
											deleteSlide(slideId);
										}}
										aria-label={`Remove slide ${String(idx + 1)}`}
									>
										Delete&nbsp;Slide
									</button>
									<button
										className="add-slide-btn inline-block h-[38px] rounded bg-blue-600 px-4 py-1 text-base font-semibold whitespace-nowrap text-white shadow transition-colors duration-150 hover:bg-blue-700 focus:ring-4 focus:outline-none"
										type="button"
										onClick={(event) => {
											event.preventDefault();
											event.stopPropagation();
											setSlideOrder([...slideOrder, slideId]);
										}}
									>
										Add&nbsp;This&nbsp;Slide&nbsp;to&nbsp;Presentation
									</button>
								</div>
							</div>

							{/* Only show text areas for currently selected fields */}
							{fields.map((field) => (
								<div key={field} className="mb-4">
									<label className="mb-1 block font-medium">
										{field}
										<AutoExpandingTextarea
											value={safeGetField({
												slides,
												slideId,
												field,
											})}
											onChange={(event) => {
												editFieldValue({
													slideId,
													field,
													value: event.target.value,
												});
											}}
											className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
											minRows={3}
											maxRows={10}
										/>
									</label>
								</div>
							))}
							{/* Debug info - remove this in production */}
							<details className="mt-4 text-xs text-gray-500">
								<summary>Debug: All field data for this slide</summary>
								<pre className="mt-2 rounded bg-gray-100 p-2">
									{
										// eslint-disable-next-line unicorn/no-null
										JSON.stringify(slide.field_data, null, 2)
									}
								</pre>
							</details>
						</div>
					);
				})
			}
		</div>
	);
}
