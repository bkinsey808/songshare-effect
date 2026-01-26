import { useTranslation } from "react-i18next";

import Button from "@/react/design-system/Button";
import PlusIcon from "@/react/design-system/icons/PlusIcon";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { safeGet } from "@/shared/utils/safe";

import useSlidesEditor from "../slides-editor/useSlidesEditor";
import { type Slide } from "../song-form-types";
import hashToHue from "./duplicateTint";
import SlidesGridTable from "./SlidesGridTable";

const EMPTY_COUNT = 0;
const INDEX_OFFSET = 1;
const HORIZONTAL_SCROLL_THRESHOLD = 1000;

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
	const { t } = useTranslation();
	const { addSlide, deleteSlide, duplicateSlide, editFieldValue, editSlideName, safeGetField } =
		useSlidesEditor({
			slideOrder,
			setSlideOrder,
			slides,
			setSlides,
		});

	// Use slideOrder to maintain the same order as Slides View, including duplicates
	const gridSlideOrder = slideOrder;

	return (
		<div className="w-full">
			<div className="mb-4">
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						{t(
							"song.slidesGridDescription",
							"These are the slides as you actually see them and can include the same slide more than once. If you edit a slide that is displayed more than once, it will edit all instances of the slide. If you don't want this behavior, you can duplicate an existing slide or add a new one.",
						)}
					</p>
				</div>
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
			{/* Add New Slide Button */}
			<div className="mt-4 flex justify-start">
				<Button
					size="compact"
					variant="primary"
					icon={<PlusIcon className="size-4" />}
					onClick={addSlide}
				>
					{t("song.addNewSlide", "Add New Slide")}
				</Button>
			</div>
			{/* Presentation Order Info */}
			{slideOrder.length > EMPTY_COUNT && (
				<div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
					<h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
						Current Presentation Order:
					</h3>
					<div className="flex flex-wrap gap-2">
						{slideOrder.map((slideId, idx) => {
							const slide = safeGet(slides, slideId);
							const isDuplicate = slideOrder.filter((id) => id === slideId).length > INDEX_OFFSET;
							const chipClass = isDuplicate
								? "rounded px-2 py-1 text-sm text-gray-200"
								: "rounded bg-blue-200 dark:bg-blue-800/30 px-2 py-1 text-sm text-blue-800 dark:text-blue-200";
							return (
								<span
									key={`order-${slideId}-${String(idx)}`}
									className={chipClass}
									{...(isDuplicate
										? {
												"data-duplicate-tint": "",
												style: {
													"--duplicate-row-hue": `${hashToHue(slideId)}`,
												} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
											}
										: {})}
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
