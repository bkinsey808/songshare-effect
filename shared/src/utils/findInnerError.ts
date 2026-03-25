/*
 * Helper to find an inner Error instance in an arbitrary value.
 *
 * This module isolates the localized `no-unsafe-type-assertion` exceptions
 * used when traversing unknown objects so the rest of the codebase can
 * remain free of repeated `oxlint-disable` comments.
 */

const DEFAULT_FIND_ERROR_DEPTH = 3;
const FIND_INNER_ERROR_MIN = 0;
const FIND_INNER_ERROR_STEP = 1;

/**
 * Recursively search an arbitrary value for an inner Error instance.
 *
 * @param obj - Value to inspect
 * @param depth - Remaining recursion depth
 * @returns an Error when found, otherwise undefined
 */
export default function findInnerError(
	obj: unknown,
	depth: number = DEFAULT_FIND_ERROR_DEPTH,
): Error | undefined {
	if (obj instanceof Error) {
		return obj;
	}
	if (depth <= FIND_INNER_ERROR_MIN) {
		return undefined;
	}
	if (typeof obj !== "object" || obj === null) {
		return undefined;
	}
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- runtime traversal of unknown object */
	const values = Object.values(obj as Record<string, unknown>);
	for (const value of values) {
		try {
			const found = findInnerError(value, depth - FIND_INNER_ERROR_STEP);
			if (found) {
				return found;
			}
		} catch {
			// ignore and continue
		}
	}
	return undefined;
}
