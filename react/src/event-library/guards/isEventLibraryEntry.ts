import { type EventLibrary } from "@/shared/generated/supabaseSchemas";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Type guard for EventLibrary.
 *
 * Checks if the given value is a valid EventLibrary object with the required
 * properties: user_id, event_id, event_owner_id, created_at.
 *
 * @param value - The value to check
 * @returns true if the value is a valid EventLibrary
 */
export function isEventLibrary(value: unknown): value is EventLibrary {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isString(value["user_id"]) &&
		isString(value["event_id"]) &&
		isString(value["event_owner_id"]) &&
		isString(value["created_at"])
	);
}

/**
 * Type guard for EventLibraryEntry.
 *
 * Checks if the given value is a valid EventLibraryEntry (EventLibrary with optional event data).
 *
 * @param value - The value to check
 * @returns true if the value is a valid EventLibraryEntry
 */
export default function isEventLibraryEntry(value: unknown): value is EventLibrary {
	return isEventLibrary(value);
}
