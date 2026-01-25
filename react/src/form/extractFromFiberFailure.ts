import { type ValidationError } from "@/shared/validation/validate-types";

import isValidationErrorArray from "./isValidationErrorArray";
import safeJsonParse from "./safeJsonParse";

/**
 * Extract ValidationError[] from FiberFailure objects.
 */
export default function extractFromFiberFailure(
	obj: Readonly<Record<string, unknown>>,
): readonly ValidationError[] {
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
