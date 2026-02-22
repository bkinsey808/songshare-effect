import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import { useTranslation } from "react-i18next";

import { type Slide } from "../song-form-types";
import DragHandle from "./DragHandle";
import hashToHue from "./duplicateTint";

const REMOVE_COUNT = 1;
const EMPTY_COUNT = 0;
const SINGLE_INSTANCE = 1;

type SlideNameCellProps = Readonly<{
	slideId: string;
	slide: Slide;
	editSlideName: ({
		slideId,
		newName,
	}: Readonly<{
		slideId: string;
		newName: string;
	}>) => void;
	setSlideOrder: (newOrder: readonly string[]) => void;
	slideOrder: readonly string[];
	duplicateSlide: (slideId: string) => void;
	deleteSlide: (slideId: string) => void;
	idx: number;
	confirmingDelete: boolean;
	setConfirmingDelete: (val: boolean) => void;
	globalIsDragging: boolean;
	attributes: DraggableAttributes;
	listeners: SyntheticListenerMap | undefined;
	/** When true, this cell uses the duplicate tint bg; the input keeps default dark bg. */
	isDuplicateRow: boolean;
}>;

/**
 * SlideNameCell
 *
 * Renders the fixed-width slide name column cell (<td>) including the drag
 * handle and action buttons (duplicate, remove/delete, and confirm/cancel).
 *
 * @param props - component props
 * @param props.slideId - Unique identifier for the slide
 * @param props.slide - Slide data object
 * @param props.editSlideName - Callback to update the slide's name
 * @param props.setSlideOrder - Setter for the presentation's slide order
 * @param props.slideOrder - Current slide order array
 * @param props.duplicateSlide - Duplicate the slide by id
 * @param props.deleteSlide - Delete the slide record
 * @param props.idx - Index of this row within the slideOrder array
 * @param props.confirmingDelete - Whether delete confirmation UI is visible
 * @param props.setConfirmingDelete - Setter to toggle delete confirmation
 * @param props.globalIsDragging - Higher-level flag used to fade/disable controls during any drag
 * @param props.attributes - Draggable attributes from useSortable (forwarded to handle)
 * @param props.listeners - Drag listeners from useSortable (forwarded to handle)
 * @returns ReactElement
 */
export default function SlideNameCell({
	slideId,
	slide,
	editSlideName,
	setSlideOrder,
	slideOrder,
	duplicateSlide,
	deleteSlide,
	idx,
	confirmingDelete,
	setConfirmingDelete,
	globalIsDragging,
	attributes,
	listeners,
	isDuplicateRow,
}: SlideNameCellProps): ReactElement {
	const { t } = useTranslation();

	const tdClass =
		"border border-gray-300 dark:border-gray-600 pl-2 pr-2 pt-[var(--slides-grid-baseline-offset)] pb-2 w-[var(--slide-name-width)] min-w-[var(--slide-name-width)] max-w-[var(--slide-name-width)] group-hover:border-gray-300 dark:group-hover:border-gray-400";
	const inputClass = isDuplicateRow
		? "w-full rounded border border-gray-600 bg-gray-800 px-2 pt-0 pb-1 text-base leading-normal text-white focus:border-blue-500 focus:outline-none"
		: "w-full rounded border border-gray-200 px-2 pt-0 pb-1 text-base leading-normal focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-transparent dark:text-white";

	/*
	 * Baseline alignment with lyrics column: this td uses pt-[var(--slides-grid-baseline-offset)]
	 * so the first line of text sits that far from the row top. The input has pt-0 so its text
	 * starts at that offset with no extra space above. text-base leading-normal matches the
	 * lyrics column; both baselines align when lyrics use the corrected offset (SortableGridCells).
	 */
	return (
		<td
			className={tdClass}
			{...(isDuplicateRow
				? {
						"data-duplicate-tint": "",
						style: {
							"--duplicate-row-hue": `${hashToHue(slideId)}`,
						} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
					}
				: {})}
		>
			<div className="space-y-2">
				<div>
					<input
						type="text"
						value={slide.slide_name}
						onChange={(event) => {
							editSlideName({ slideId, newName: event.target.value });
						}}
						className={inputClass}
						placeholder="Slide name"
					/>
				</div>
				<div className="flex gap-1">
					<DragHandle attributes={attributes} listeners={listeners} />
					<button
						className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700"
						type="button"
						onClick={() => {
							setSlideOrder([...slideOrder, slideId]);
						}}
						title={t(
							"song.addSameSlideAtAnotherPosition",
							"Add this same slide at another position",
						)}
						aria-label={t(
							"song.addSameSlideAtAnotherPosition",
							"Add this same slide at another position",
						)}
					>
						<span className="text-sm">🔗</span>
					</button>
					<button
						className="flex h-8 w-8 items-center justify-center rounded bg-green-600 text-white hover:bg-green-700"
						type="button"
						onClick={() => {
							duplicateSlide(slideId);
						}}
						title="Duplicate Slide"
						aria-label="Duplicate Slide"
					>
						<span className="text-sm">📋</span>
					</button>
					<button
						type="button"
						className="hidden"
						onClick={() => {
							const newSlideOrder = [...slideOrder];
							newSlideOrder.splice(idx, REMOVE_COUNT);
							setSlideOrder(newSlideOrder);

							const remainingInstances = newSlideOrder.filter((id) => id === slideId);
							if (remainingInstances.length === EMPTY_COUNT) {
								deleteSlide(slideId);
							}
						}}
						title={
							slideOrder.filter((id) => id === slideId).length === SINGLE_INSTANCE
								? "Delete Slide"
								: "Remove from Presentation"
						}
						aria-label={
							slideOrder.filter((id) => id === slideId).length === SINGLE_INSTANCE
								? "Delete Slide"
								: "Remove from Presentation"
						}
					>
						<span className="text-sm">🗑️</span>{" "}
					</button>{" "}
					{(() => {
						// Hide delete when this is the last slide (we don't allow deleting the last slide)
						if (slideOrder.length === SINGLE_INSTANCE) {
							return undefined;
						}
						const instancesCount = slideOrder.filter((id) => id === slideId).length;
						const isSingleInstance = instancesCount === SINGLE_INSTANCE;

						if (!isSingleInstance) {
							return (
								<button
									type="button"
									className="flex h-8 w-8 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700"
									onClick={() => {
										const newSlideOrder = [...slideOrder];
										newSlideOrder.splice(idx, REMOVE_COUNT);
										setSlideOrder(newSlideOrder);
									}}
									title="Remove from Presentation"
									aria-label="Remove from Presentation"
								>
									<span className="text-sm">🗑️</span>
								</button>
							);
						}

						if (confirmingDelete) {
							return (
								<div
									className={`${globalIsDragging ? "opacity-40 pointer-events-none" : ""} flex items-center gap-2`}
								>
									<button
										type="button"
										className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
										onClick={() => {
											setConfirmingDelete(false);
										}}
										disabled={globalIsDragging}
									>
										Cancel
									</button>
									<button
										type="button"
										className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
										onClick={() => {
											const newSlideOrder = [...slideOrder];
											newSlideOrder.splice(idx, REMOVE_COUNT);
											setSlideOrder(newSlideOrder);
											deleteSlide(slideId);
											setConfirmingDelete(false);
										}}
										disabled={globalIsDragging}
									>
										Delete
									</button>
								</div>
							);
						}

						return (
							<button
								type="button"
								className="flex h-8 w-8 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700"
								onClick={() => {
									setConfirmingDelete(true);
								}}
								title="Delete Slide"
								aria-label="Delete Slide"
							>
								<span className="text-sm">🗑️</span>
							</button>
						);
					})()}
				</div>
			</div>
		</td>
	);
}
