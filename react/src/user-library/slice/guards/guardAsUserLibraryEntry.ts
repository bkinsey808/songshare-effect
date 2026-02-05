import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibraryEntry } from "../user-library-types";

/**
 * isUserLibraryEntry
 *
 * Type guard that verifies an unknown value has the shape of a
 * `UserLibraryEntry` (required keys and types).
 */

/**
 * Type guard verifying a value is a `UserLibraryEntry`.
 *
 * @param value - Value to check
 * @returns True when `value` matches the `UserLibraryEntry` shape
 */
export function isUserLibraryEntry(value: unknown): value is UserLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["user_id"] === "string" &&
		typeof value["followed_user_id"] === "string" &&
		typeof value["created_at"] === "string"
	);
}

/**
 * guardAsUserLibraryEntry
 *
 * Runtime assertion that throws a `TypeError` if the provided value is not a
 * valid `UserLibraryEntry`. Useful when validating external data (e.g., server
 * responses) before using it in slice updates.
 *
 * @param input - Value to assert as `UserLibraryEntry`.
 * @param where - Optional context string used in the thrown error message.
 * @returns - The validated `UserLibraryEntry`.
 */
export default function guardAsUserLibraryEntry(input: unknown, where = "value"): UserLibraryEntry {
	if (!isUserLibraryEntry(input)) {
		throw new TypeError(`${where} must be a valid UserLibraryEntry`);
	}
	return input;
}
