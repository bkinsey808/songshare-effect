import type { UserLibraryEntry } from "../slice/user-library-types";

import isUserLibraryEntry from "./isUserLibraryEntry";

export { isUserLibraryEntry };

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
