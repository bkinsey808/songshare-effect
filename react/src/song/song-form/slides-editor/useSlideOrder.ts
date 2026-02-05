/**
 * Custom hook for managing slide order operations.
 *
 * @param slideOrder - Current slide order array
 * @param setSlideOrder - Setter to update the slide order
 * @returns Handlers for modifying slide order: `duplicateSlideOrder`, `removeSlideOrder`, `moveSlideUp`, `moveSlideDown`
 */
import { ONE } from "@/shared/constants/shared-constants";

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
	moveSlideUp: (index: number) => void;
	moveSlideDown: (index: number) => void;
} {
	const NOT_FOUND = -1;
	const NONE = 0;

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

	function moveSlideUp(index: number): void {
		if (index <= NONE || index >= slideOrder.length) {
			return;
		}
		const newOrder = [...slideOrder];
		const current = newOrder[index];
		const previous = newOrder[index - ONE];
		if (current === undefined || previous === undefined) {
			return;
		}
		newOrder[index - ONE] = current;
		newOrder[index] = previous;
		setSlideOrder(newOrder);
	}

	function moveSlideDown(index: number): void {
		if (index < NONE || index >= slideOrder.length - ONE) {
			return;
		}
		const newOrder = [...slideOrder];
		const current = newOrder[index];
		const next = newOrder[index + ONE];
		if (current === undefined || next === undefined) {
			return;
		}
		newOrder[index + ONE] = current;
		newOrder[index] = next;
		setSlideOrder(newOrder);
	}

	return {
		duplicateSlideOrder,
		removeSlideOrder,
		moveSlideUp,
		moveSlideDown,
	};
}
