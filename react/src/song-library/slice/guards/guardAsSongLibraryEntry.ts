import type { SongLibraryEntry } from "../song-library-types";

import isSongLibraryEntry from "./isSongLibraryEntry";

/**
 * Validates and asserts that a value is a SongLibraryEntry, throwing if invalid.
 *
 * @param value - Value to validate
 * @param context - Optional context string for error message
 * @returns The validated value cast as SongLibraryEntry
 * @throws Error if value is not a valid SongLibraryEntry
 */
export default function guardEAsSongLibraryEntry(
	value: unknown,
	context?: string,
): SongLibraryEntry {
	if (!isSongLibraryEntry(value)) {
		const msg =
			typeof context === "string"
				? `${context}: invalid SongLibraryEntry`
				: "Invalid SongLibraryEntry";
		throw new Error(msg);
	}
	return value;
}
