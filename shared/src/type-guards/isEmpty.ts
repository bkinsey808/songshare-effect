import { ZERO } from "@/shared/constants/shared-constants";

/**
 * Check whether a value is empty (null/undefined, empty string, empty array, empty map/set, or object with no keys).
 *
 * @param value - Value to test for emptiness
 * @returns True when the value is empty
 */
export default function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) {
		return true;
	}

	if (typeof value === "string") {
		return value.trim().length === ZERO;
	}

	if (Array.isArray(value)) {
		return value.length === ZERO;
	}

	if (value instanceof Map || value instanceof Set) {
		return value.size === ZERO;
	}

	if (typeof value === "object") {
		return Object.keys(value).length === ZERO;
	}

	return false;
}
