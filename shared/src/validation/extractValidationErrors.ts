import isRecord from "@/shared/type-guards/isRecord";

import { type ValidationError } from "./validate-types";

/**
 * Safely extract ValidationError[] from various unknown shapes.
 *
 * @param input - Unknown payload to inspect for validation error shapes
 * @returns An array of ValidationError objects (possibly empty)
 */
export default function extractValidationErrors(input: unknown): readonly ValidationError[] {
	// Local runtime guard to validate array items look like ValidationError
	function isValidationErrorArray(value: unknown): value is ValidationError[] {
		if (!Array.isArray(value)) {
			return false;
		}
		return value.every((item) => {
			if (!isRecord(item)) {
				return false;
			}
			const rec = item;
			return (
				Object.hasOwn(rec, "field") &&
				Object.hasOwn(rec, "message") &&
				typeof rec["field"] === "string" &&
				typeof rec["message"] === "string"
			);
		});
	}

	// Direct array
	if (isValidationErrorArray(input)) {
		return input;
	}

	// Error instance: try parsing message
	if (input instanceof Error) {
		try {
			const parsed = JSON.parse(input.message) as unknown;
			if (isValidationErrorArray(parsed)) {
				return parsed;
			}
		} catch {
			// If the Error carries a `cause` property that contains the array,
			// prefer that. Use `Reflect.get` to avoid unsafe casts.
			const maybeCause = Reflect.get(input, "cause");
			if (isValidationErrorArray(maybeCause)) {
				return maybeCause;
			}
			return [];
		}
	}

	// FiberFailure-like objects or other wrapped shapes
	if (isRecord(input)) {
		const obj = input;

		if ("cause" in obj && isValidationErrorArray(obj["cause"])) {
			return obj["cause"];
		}

		if ("message" in obj && typeof obj["message"] === "string") {
			try {
				const parsed = JSON.parse(String(obj["message"])) as unknown;
				if (isValidationErrorArray(parsed)) {
					return parsed;
				}
			} catch {
				return [];
			}
		}
	}

	return [];
}
