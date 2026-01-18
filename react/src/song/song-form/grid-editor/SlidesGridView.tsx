import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { safeGet } from "@/shared/utils/safe";

import useSlidesEditor from "../slides-editor/useSlidesEditor";
import { type Slide } from "../songTypes";
import SlidesGridTable from "./SlidesGridTable";

type SlidesGridViewProps = Readonly<
	ReadonlyDeep<{
		readonly fields: readonly string[];
		readonly slideOrder: readonly string[];
		readonly setSlideOrder: (newOrder: readonly string[]) => void;
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
	const { addSlide, deleteSlide, duplicateSlide, editFieldValue, editSlideName, safeGetField } =
		useSlidesEditor({
			slideOrder,
			setSlideOrder,
			slides,
			setSlides,
		});

	const EMPTY_COUNT = 0;
	const INDEX_OFFSET = 1;

	// Use slideOrder to maintain the same order as Slides View, including duplicates
	const gridSlideOrder = slideOrder;

	const HORIZONTAL_SCROLL_THRESHOLD = 1000;

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
			<SlidesGridTable
				fields={fields}
				slideOrder={gridSlideOrder}
				slides={slides}
				horizontalScrollThreshold={HORIZONTAL_SCROLL_THRESHOLD}
				editSlideName={editSlideName}
				editFieldValue={editFieldValue}
				safeGetField={safeGetField}
				setSlideOrder={setSlideOrder}
				duplicateSlide={duplicateSlide}
				deleteSlide={deleteSlide}
			/>
			{/* Presentation Order Info */}
			{slideOrder.length > EMPTY_COUNT && (
				<div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
					<h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
						Current Presentation Order:
					</h3>
					<div className="flex flex-wrap gap-2">
						{slideOrder.map((slideId, idx) => {
							const slide = safeGet(slides, slideId);
							return (
								<span
									key={`order-${slideId}-${String(idx)}`}
									className="rounded bg-blue-200 dark:bg-blue-800/30 px-2 py-1 text-sm text-blue-800 dark:text-blue-200"
								>
									{idx + INDEX_OFFSET}. {slide?.slide_name ?? "Unknown Slide"}
								</span>
							);
						})}
					</div>
					<p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
						Use the Slides view to reorder or modify presentation sequence.
					</p>
				</div>
			)}
		</div>
	);
}
