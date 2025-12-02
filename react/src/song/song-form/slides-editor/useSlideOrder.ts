/**
 * Custom hook for managing slide order operations
 */

export default function useSlideOrder({
	slideOrder,
	setSlideOrder,
}: Readonly<{
	slideOrder: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
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
	const ONE = 1;
	const NOT_FOUND = -1;

	// Duplicate a slide in the order array (can appear multiple times)
	function duplicateSlideOrder(slideId: string): void {
		setSlideOrder([...slideOrder, slideId]);
	}

	// Remove only the clicked instance of slideId from the order array
	function removeSlideOrder({
		slideId,
		index,
	}: Readonly<{
		slideId: string;
		index?: number;
	}>): void {
		if (slideOrder.length === ONE) {
			return;
		}
		if (typeof index === "number") {
			const newOrder = [...slideOrder];
			newOrder.splice(index, ONE);
			setSlideOrder(newOrder);
		} else {
			// fallback: remove first occurrence
			const idx = slideOrder.indexOf(slideId);
			if (idx !== NOT_FOUND) {
				const newOrder = [...slideOrder];
				newOrder.splice(idx, ONE);
				setSlideOrder(newOrder);
			}
		}
	}

	return {
		duplicateSlideOrder,
		removeSlideOrder,
	};
}
