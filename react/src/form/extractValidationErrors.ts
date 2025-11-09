import { extractFromFiberFailure } from "./extractFromFiberFailure";
import { safeJsonParse } from "./safeJsonParse";
import type { ValidationError } from "@/shared/validation/types";

/**
 * Extract ValidationError[] from various error shapes used in the codebase.
 * Keeps the extraction logic in one place to reduce cognitive complexity.
 */
export const extractValidationErrors = (
	error: unknown,
): ReadonlyArray<ValidationError> => {
	// Direct array
	if (Array.isArray(error)) {
		return error as ValidationError[];
	}

	// Error instance: try parsing message
	if (error instanceof Error) {
		const parsed = safeJsonParse(error.message);
		if (Array.isArray(parsed)) {
			return parsed as ValidationError[];
		}
		return [];
	}

	// Object shapes (FiberFailure, wrapped errors, etc.)
	if (typeof error === "object" && error !== null) {
		const obj = error as Record<string, unknown>;

		if ("_tag" in obj && obj["_tag"] === "FiberFailure") {
			return extractFromFiberFailure(obj);
		}

		// Some wrappers might themselves be arrays
		if (Array.isArray(obj)) {
			return obj as ValidationError[];
		}
	}

	return [];
};
