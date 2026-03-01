import isRecord from "@/shared/type-guards/isRecord";
import { type ValidationError } from "@/shared/validation/validate-types";

import extractFromFiberFailure from "./extractFromFiberFailure";
import isValidationErrorArray from "./isValidationErrorArray";
import safeJsonParse from "./safeJsonParse";

/**
 * Extract ValidationError[] from various error shapes used in the codebase.
 * Keeps the extraction logic in one place to reduce cognitive complexity.
 *
 * This function is pure: it performs no observable side effects and will
 * always return the same output for the same input. It may return
 * references to input arrays (it does not deep-clone returned arrays).
 * Purity depends on the imported helpers (`isValidationErrorArray`,
 * `safeJsonParse`, `isRecord`, `extractFromFiberFailure`) also being
 * side-effect free. Since it is pure, it is not recommended to mock it in
 * tests; instead, test the actual implementation and its helpers to ensure
 * correct behavior.
 *
 * @param error - Error-like value to inspect for validation errors
 * @returns Array of `ValidationError` extracted from the provided value
 */
export default function extractValidationErrors(error: unknown): readonly ValidationError[] {
	// Direct array
	if (isValidationErrorArray(error)) {
		return error;
	}

	// Error instance: try parsing message
	if (error instanceof Error) {
		const parsed = safeJsonParse(error.message);
		if (isValidationErrorArray(parsed)) {
			return parsed;
		}
		return [];
	}

	// Object shapes (FiberFailure, wrapped errors, etc.)
	if (typeof error === "object" && error !== null) {
		// Narrow to a record for runtime property checks using our guard
		if (!isRecord(error)) {
			return [];
		}
		const obj = error;

		if (
			Object.hasOwn(obj, "_tag") &&
			typeof obj["_tag"] === "string" &&
			obj["_tag"] === "FiberFailure"
		) {
			return extractFromFiberFailure(obj);
		}

		// Some wrappers might themselves be arrays
		if (isValidationErrorArray(obj)) {
			return obj;
		}
	}

	return [];
}
