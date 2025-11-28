import { isRecord, isString } from "@/shared/utils/typeGuards";
import { type ValidationError } from "@/shared/validation/types";

import { safeJsonParse } from "./safeJsonParse";

function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((item) => {
		if (!isRecord(item)) {
			return false;
		}
		const { field, message } = item;
		return isString(field) && isString(message);
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
