/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */
import type { ValidationError } from "@/shared/validation/types";

import { safeJsonParse } from "./safeJsonParse";

function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((item) => {
		if (typeof item !== "object" || item === null) {
			return false;
		}
		const record = item as Record<string, unknown>;
		const { field, message } = record;
		return (
			Object.hasOwn(record, "field") &&
			Object.hasOwn(record, "message") &&
			typeof field === "string" &&
			typeof message === "string"
		);
	});
}

/**
 * Extract ValidationError[] from FiberFailure objects.
 */
export function extractFromFiberFailure(
	obj: Readonly<Record<string, unknown>>,
): ReadonlyArray<ValidationError> {
	// cause may directly be the array
	if ("cause" in obj) {
		const { cause } = obj;
		if (isValidationErrorArray(cause)) {
			return cause;
		}
	}

	// message may be a JSON-encoded array
	if ("message" in obj) {
		const { message } = obj;
		const parsed = safeJsonParse(message);
		if (isValidationErrorArray(parsed)) {
			return parsed;
		}
	}

	return [];
}
