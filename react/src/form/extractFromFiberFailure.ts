/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */
import type { ValidationError } from "@/shared/validation/types";

import { safeJsonParse } from "./safeJsonParse";

function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) return false;
	return value.every((item) => {
		return (
			typeof item === "object" &&
			item !== null &&
			Object.prototype.hasOwnProperty.call(item, "field") &&
			Object.prototype.hasOwnProperty.call(item, "message") &&
			typeof (item as Record<string, unknown>)["field"] === "string" &&
			typeof (item as Record<string, unknown>)["message"] === "string"
		);
	});
}

/**
 * Extract ValidationError[] from FiberFailure objects.
 */
export const extractFromFiberFailure = (
	obj: Readonly<Record<string, unknown>>,
): ReadonlyArray<ValidationError> => {
	// cause may directly be the array
	if ("cause" in obj) {
		const cause = obj["cause"];
		if (isValidationErrorArray(cause)) {
			return cause;
		}
	}

	// message may be a JSON-encoded array
	if ("message" in obj) {
		const parsed = safeJsonParse(obj["message"]);
		if (isValidationErrorArray(parsed)) {
			return parsed;
		}
	}

	return [];
};
