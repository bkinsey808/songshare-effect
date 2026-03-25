/*
 * Central helper for extracting nested Errors from arbitrary payloads.
 *
 * This isolates a small number of localized type assertions used to probe
 * unknown values for inner Error instances. Keeping the unsafe assertions
 * contained in a single helper reduces the need for repeated inline
 * `oxlint-disable` comments throughout the codebase.
 */

import findInnerError from "./findInnerError";

/**
 * Unwrap common error wrapper shapes or return the original value.
 *
 * This checks `cause`, `error`, and `failure.cause` shapes after attempting
 * deep traversal with `findInnerError`.
 *
 * @param err - error to unwrap
 * @returns unwrapped error or the original value
 */
export default function unwrapError(err: unknown): unknown {
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
