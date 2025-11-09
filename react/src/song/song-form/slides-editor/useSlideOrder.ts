/**
 * Custom hook for managing slide order operations
 */

export function useSlideOrder({
	slideOrder,
	setSlideOrder,
}: Readonly<{
	slideOrder: ReadonlyArray<string>;
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
}>): {
	duplicateSlideOrder: (slideId: string) => void;
	removeSlideOrder: ({
		slideId,
		index,
	}: Readonly<{
		slideId: string;
		index?: number;
	}>) => void;
} {
	// Duplicate a slide in the order array (can appear multiple times)
	const duplicateSlideOrder = (slideId: string): void => {
		setSlideOrder([...slideOrder, slideId]);
	};

	// Remove only the clicked instance of slideId from the order array
	const removeSlideOrder = ({
		slideId,
		index,
	}: Readonly<{
		slideId: string;
		index?: number;
	}>): void => {
		if (slideOrder.length === 1) {
			return;
		}
		if (typeof index === "number") {
			const newOrder = [...slideOrder];
			newOrder.splice(index, 1);
			setSlideOrder(newOrder);
		} else {
			// fallback: remove first occurrence
			const idx = slideOrder.indexOf(slideId);
			if (idx !== -1) {
				const newOrder = [...slideOrder];
				newOrder.splice(idx, 1);
				setSlideOrder(newOrder);
			}
		}
	};

	return {
		duplicateSlideOrder,
		removeSlideOrder,
	};
}
