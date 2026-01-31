/**
 * Pure helpers for manipulating a playlist's song order array.
 */

/**
 * Adds `songId` to the end of `order` if it is not already present.
 * @param order - Current song order
 * @param songId - Song id to add
 * @returns New song order array
 */
export function addSongToOrder(order: readonly string[], songId: string): string[] {
	if (order.includes(songId)) {
		return [...order];
	}

	return [...order, songId];
}

/**
 * Removes `songId` from `order` if present.
 * @param order - Current song order
 * @param songId - Song id to remove
 * @returns New song order array
 */
export function removeSongFromOrder(order: readonly string[], songId: string): string[] {
	return order.filter((id) => id !== songId);
}

/**
 * Move an item up by one position. If index is 0 or invalid, returns original array.
 * @param order - Current song order
 * @param index - Index of the item to move up
 * @returns New song order array
 */
export function moveSongUp(order: readonly string[], index: number): string[] {
	const MIN_INDEX = 0;

	if (index <= MIN_INDEX || index >= order.length) {
		return [...order];
	}

	const newOrder = [...order];
	const PREV_INDEX = 1;
	const prev = newOrder[index - PREV_INDEX];
	const cur = newOrder[index];

	if (prev === undefined || cur === undefined) {
		return newOrder;
	}

	[newOrder[index - PREV_INDEX], newOrder[index]] = [cur, prev];
	return newOrder;
}

/**
 * Move an item down by one position. If index is at the end or invalid, returns original array.
 * @param order - Current song order
 * @param index - Index of the item to move down
 * @returns New song order array
 */
export function moveSongDown(order: readonly string[], index: number): string[] {
	const MIN_INDEX = 0;
	const STEP = 1;
	const LAST_INDEX = order.length - STEP;

	if (index < MIN_INDEX || index >= LAST_INDEX) {
		return [...order];
	}

	const newOrder = [...order];
	const cur = newOrder[index];
	const next = newOrder[index + STEP];

	if (cur === undefined || next === undefined) {
		return newOrder;
	}

	[newOrder[index], newOrder[index + STEP]] = [next, cur];
	return newOrder;
}
