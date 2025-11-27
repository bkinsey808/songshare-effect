/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */
import type { ValidationError } from "@/shared/validation/types";

import { extractFromFiberFailure } from "./extractFromFiberFailure";
import { safeJsonParse } from "./safeJsonParse";

function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((item) => {
		if (typeof item !== "object" || item === null) {
			return false;
		}
		// Use bracket access and narrow with runtime checks. These localized
		// disables acknowledge we need to inspect unknown shapes safely.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const maybe = item as Record<string, unknown>;
		if (!("field" in maybe) || !("message" in maybe)) {
			return false;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return (
			typeof maybe["field"] === "string" && typeof maybe["message"] === "string"
		);
	});
}

/**
 * Extract ValidationError[] from various error shapes used in the codebase.
 * Keeps the extraction logic in one place to reduce cognitive complexity.
 */
export function extractValidationErrors(
	error: unknown,
): ReadonlyArray<ValidationError> {
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
		// Narrow to a record for property checks; localized disable is safe.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const obj = error as Record<string, unknown>;

		if ("_tag" in obj && obj["_tag"] === "FiberFailure") {
			return extractFromFiberFailure(obj);
		}

		// Some wrappers might themselves be arrays
		if (isValidationErrorArray(obj)) {
			return obj;
		}
	}

	return [];
}
