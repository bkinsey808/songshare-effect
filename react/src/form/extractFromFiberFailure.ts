import { safeJsonParse } from "./safeJsonParse";
import type { ValidationError } from "@/shared/validation/types";

/**
 * Extract ValidationError[] from FiberFailure objects.
 */
export const extractFromFiberFailure = (
	obj: Readonly<Record<string, unknown>>,
): ReadonlyArray<ValidationError> => {
	// cause may directly be the array
	if ("cause" in obj) {
		const cause = obj["cause"];
		if (Array.isArray(cause)) {
			return cause as ValidationError[];
		}
	}

	// message may be a JSON-encoded array
	if ("message" in obj) {
		const parsed = safeJsonParse(obj["message"]);
		if (Array.isArray(parsed)) {
			return parsed as ValidationError[];
		}
	}

	return [];
};
