/*
 * Central helper for extracting nested Errors from arbitrary payloads.
 *
 * This isolates a small number of localized type assertions used to probe
 * unknown values for inner Error instances. Keeping the unsafe assertions
 * contained in a single helper reduces the need for repeated inline
 * `oxlint-disable` comments throughout the codebase.
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
export function findInnerError(
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
	// Localized, documented assertion: we only need the object's values to
	// traverse for inner Error instances. Keep the cast and single-line
	// eslint exception localized here rather than repeating it where used.
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

/**
 * Unwrap common error wrapper shapes or return the original value.
 *
 * This checks `cause`, `error`, and `failure.cause` shapes after attempting
 * deep traversal with `findInnerError`.
 */
export function unwrapError(err: unknown): unknown {
	const inner = findInnerError(err);
	if (inner) {
		return inner;
	}
	// fall back to shallow unwraps for common wrapper shapes
	if (typeof err !== "object" || err === null) {
		return err;
	}
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shallow property access on unknown object */
	const anyErr = err as Record<string, unknown>;
	const { cause, error: errorVal, failure } = anyErr;
	if (cause instanceof Error) {
		return cause;
	}
	if (errorVal instanceof Error) {
		return errorVal;
	}
	if (typeof failure === "object" && failure !== null) {
		/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shallow property on unknown */
		const failureObj = failure as Record<string, unknown>;
		const failureCause = failureObj["cause"];
		if (failureCause instanceof Error) {
			return failureCause;
		}
	}
	return err;
}
