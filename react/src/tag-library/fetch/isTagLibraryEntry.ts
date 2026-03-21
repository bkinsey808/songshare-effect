import isRecord from "@/shared/type-guards/isRecord";

import type { TagLibraryEntry } from "../slice/TagLibraryEntry.type";

/**
 * Type guard that verifies an unknown value has the shape of a
 * `TagLibraryEntry` (required keys and primitive types only).
 *
 * @param value - Value to check
 * @returns True when `value` matches the `TagLibraryEntry` shape
 */
export default function isTagLibraryEntry(value: unknown): value is TagLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value["user_id"] === "string" && typeof value["tag_slug"] === "string";
}
