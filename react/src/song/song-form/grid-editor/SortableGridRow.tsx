import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import AutoExpandingTextarea from "../../../design-system/AutoExpandingTextarea";
import { type Slide } from "../songTypes";

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
}>;

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
}: SortableGridRowProps): ReactElement {
	const SLIDE_NAME_WIDTH = 144;
	const DRAG_OPACITY = 0.5;
	const NORMAL_OPACITY = 1;
	const REMOVE_COUNT = 1;
	const EMPTY_COUNT = 0;
	const SINGLE_INSTANCE = 1;
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: slideId,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? DRAG_OPACITY : NORMAL_OPACITY,
	};

	return (
		<tr
			ref={setNodeRef}
			style={style}
			key={`${slideId}-grid-${String(idx)}`}
			className={`hover:bg-gray-50 ${isDragging ? "z-10" : ""}`}
		>
			{/* Slide Name Column - Fixed width */}
			<td
				className="border border-gray-300 px-2 py-2"
				style={{
					width: `${SLIDE_NAME_WIDTH}px`,
					minWidth: `${SLIDE_NAME_WIDTH}px`,
					maxWidth: `${SLIDE_NAME_WIDTH}px`,
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
							className="w-full rounded border border-gray-200 px-2 py-1 focus:border-blue-500 focus:outline-none"
							placeholder="Slide name"
						/>
					</div>
					<div className="flex gap-1">
						{/* Drag Handle */}
						<div
							{...attributes}
							{...listeners}
							className="flex h-8 w-8 cursor-grab items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600 active:cursor-grabbing"
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
							title="Add to Presentation"
							aria-label="Add to Presentation"
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
							className="flex h-8 w-8 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700"
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
							<span className="text-sm">🗑️</span>
						</button>
					</div>
				</div>
			</td>

			{/* Dynamic Field Columns with resizable widths */}
			{fields.map((field) => (
				<td
					key={field}
					className="border border-gray-300 p-0"
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
						className="h-full w-full border-none p-2 focus:outline-none"
						placeholder={`Enter ${field}...`}
						minRows={2}
						maxRows={8}
					/>
				</td>
			))}
		</tr>
	);
}
