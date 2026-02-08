import { clientWarn } from "@/react/lib/utils/clientLogger";
import { type EventLibrary } from "@/shared/generated/supabaseSchemas";

import isEventLibraryEntry from "./isEventLibraryEntry";

/**
 * Guard that validates and casts a value as an EventLibrary.
 *
 * Validates the value using `isEventLibraryEntry` and either returns the
 * validated entry or throws an error with context.
 *
 * @param value - The value to validate
 * @param context - Optional context string for error messages (e.g., "server response")
 * @returns - The validated EventLibrary entry
 * @throws - Error if value is not a valid EventLibrary
 */
export default function guardAsEventLibraryEntry(
	value: unknown,
	context = "EventLibrary entry",
): EventLibrary {
	if (!isEventLibraryEntry(value)) {
		clientWarn(`[guardAsEventLibraryEntry] Invalid ${context}:`, value);
		throw new TypeError(`Expected valid EventLibrary in ${context}`);
	}

	return value;
}
