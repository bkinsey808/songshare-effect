import { isRecord } from "@/shared/utils/typeGuards";
import { type ValidationError } from "@/shared/validation/validate-types";

import extractFromFiberFailure from "./extractFromFiberFailure";
import safeJsonParse from "./safeJsonParse";

function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((item) => {
		if (typeof item !== "object" || item === null) {
			return false;
		}
		// Use a runtime guard to narrow unknown -> Record<string, unknown>
		if (!isRecord(item)) {
			return false;
		}
		return (
			Object.hasOwn(item, "field") &&
			Object.hasOwn(item, "message") &&
			typeof item["field"] === "string" &&
			typeof item["message"] === "string"
		);
	});
}

/**
 * Extract ValidationError[] from various error shapes used in the codebase.
 * Keeps the extraction logic in one place to reduce cognitive complexity.
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
