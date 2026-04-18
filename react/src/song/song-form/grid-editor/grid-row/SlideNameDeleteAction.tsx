const REMOVE_COUNT = 1;
const SINGLE_INSTANCE = 1;

type SlideNameDeleteActionProps = Readonly<{
	slideId: string;
	slideOrder: readonly string[];
	idx: number;
	setSlideOrder: (newOrder: readonly string[]) => void;
	deleteSlide: (slideId: string) => void;
	confirmingDelete: boolean;
	setConfirmingDelete: (val: boolean) => void;
	globalIsDragging: boolean;
}>;

/**
 * Renders the delete/remove control for the slide-name action row.
 *
 * Hides itself when the presentation only has one slide, shows a simple
 * remove button for duplicate instances, and shows a confirmation flow when
 * deleting the last remaining instance of a slide.
 *
 * @param slideId - Unique identifier for the slide being edited
 * @param slideOrder - Current ordered slide ids in the presentation
 * @param idx - Current row index within `slideOrder`
 * @param setSlideOrder - Setter for the updated slide order
 * @param deleteSlide - Deletes the slide record when its last instance is removed
 * @param confirmingDelete - Whether the delete confirmation UI is visible
 * @param setConfirmingDelete - Toggles delete confirmation state
 * @param globalIsDragging - Whether any slide row is currently being dragged
 * @returns Delete/remove action UI, or undefined when deletion is not allowed
 */
export default function SlideNameDeleteAction({
	slideId,
	slideOrder,
	idx,
	setSlideOrder,
	deleteSlide,
	confirmingDelete,
	setConfirmingDelete,
	globalIsDragging,
}: SlideNameDeleteActionProps): ReactElement | undefined {
	// Hide delete when this is the last slide; the UI does not allow removing the final slide.
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
}
