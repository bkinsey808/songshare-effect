import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibraryEntry } from "../slice/user-library-types";

/**
 * isUserLibraryEntry
 *
 * Type guard that verifies an unknown value has the shape of a
 * `UserLibraryEntry` (required keys and primitive types only).
 *
 * @param value - Value to check
 * @returns True when `value` matches the `UserLibraryEntry` shape
 */
export default function isUserLibraryEntry(value: unknown): value is UserLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["user_id"] === "string" &&
		typeof value["followed_user_id"] === "string" &&
		typeof value["created_at"] === "string"
	);
}
