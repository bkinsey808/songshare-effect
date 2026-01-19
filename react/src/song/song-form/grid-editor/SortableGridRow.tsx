import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "../../../design-system/AutoExpandingTextarea";
import { type Slide } from "../songTypes";
import DeleteConfirmationRow from "./DeleteConfirmationRow";

const DRAG_OPACITY = 0.5;
const NORMAL_OPACITY = 1;
const REMOVE_COUNT = 1;
const EMPTY_COUNT = 0;
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
 * @param props - props for the grid row
 * @returns ReactElement
 */
export default function SortableGridRow({
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
	const { t } = useTranslation();
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

	// If this is the last instance and the user has clicked delete, replace the
	// entire row with a confirmation message so it's clear this will delete the
	// slide and its data.
	if (isSingleInstance && confirmingDelete) {
		return (
			<DeleteConfirmationRow
				rowRef={setNodeRef}
				style={style}
				isDragging={isDragging}
				isFaded={globalIsDragging}
				colSpan={totalColumns}
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
		);
	}

	return (
		<tr
			ref={setNodeRef}
			style={style}
			key={`${slideId}-grid-${String(idx)}`}
			className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isDragging ? "z-10" : ""}`}
		>
			{/* Slide Name Column - Fixed width */}
			<td
				className="border border-gray-300 dark:border-gray-600 px-2 py-2"
				style={{
					width: "var(--slide-name-width)",
					minWidth: "var(--slide-name-width)",
					maxWidth: "var(--slide-name-width)",
				}}
			>
				<div className="space-y-2">
					<div>
						<input
							type="text"
							value={slide.slide_name}
							onChange={(event) => {
								editSlideName({ slideId, newName: event.target.value });
							}}
							className="w-full rounded border border-gray-200 px-2 py-1 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-transparent dark:text-white"
							placeholder="Slide name"
						/>
					</div>
					<div className="flex gap-1">
						{/* Drag Handle */}
						<div
							{...attributes}
							{...listeners}
							className="flex h-8 w-8 cursor-grab items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600 active:cursor-grabbing dark:bg-gray-600 dark:hover:bg-gray-500"
							title="Drag to reorder"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								className="text-white"
							>
								<path d="M3 7h18M3 12h18M3 17h18" />
							</svg>
						</div>
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
								// Remove this instance from slideOrder
								const newSlideOrder = [...slideOrder];
								newSlideOrder.splice(idx, REMOVE_COUNT);
								setSlideOrder(newSlideOrder);

								// If this was the last instance of this slideId, delete the actual slide
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

			{/* Dynamic Field Columns with resizable widths */}
			{fields.map((field) => (
				<td
					key={field}
					className="border border-gray-300 dark:border-gray-600 p-0"
					style={{
						width: `${getColumnWidth(field)}px`,
						minWidth: `${getColumnWidth(field)}px`,
						maxWidth: `${getColumnWidth(field)}px`,
					}}
				>
					<AutoExpandingTextarea
						value={safeGetField({ slides, slideId, field })}
						onChange={(event) => {
							editFieldValue({ slideId, field, value: event.target.value });
						}}
						className="h-full w-full border-none p-2 focus:outline-none text-black dark:text-white bg-transparent"
						placeholder={`Enter ${field}...`}
						minRows={2}
						maxRows={8}
					/>
				</td>
			))}
		</tr>
	);
}
