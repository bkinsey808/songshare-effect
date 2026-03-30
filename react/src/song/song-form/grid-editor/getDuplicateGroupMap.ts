const EMPTY_COUNT = 0;
const SINGLE_OCCURRENCE = 1;

/**
 * Build a map from slideId -> group index for slide IDs that appear more than once in order.
 *
 * @param slideOrder - Ordered list of slide ids in the grid.
 * @returns Duplicate slide ids mapped to their duplicate-group index.
 */
export default function getDuplicateGroupMap(
	slideOrder: readonly string[],
): Map<string, number> {
	const counts = new Map<string, number>();
	for (const id of slideOrder) {
		counts.set(id, (counts.get(id) ?? EMPTY_COUNT) + SINGLE_OCCURRENCE);
	}

	const map = new Map<string, number>();
	let groupIndex = EMPTY_COUNT;
	const seen = new Set<string>();

	for (const id of slideOrder) {
		if ((counts.get(id) ?? EMPTY_COUNT) > SINGLE_OCCURRENCE && !seen.has(id)) {
			seen.add(id);
			map.set(id, groupIndex);
			groupIndex += SINGLE_OCCURRENCE;
		}
	}

	return map;
}
