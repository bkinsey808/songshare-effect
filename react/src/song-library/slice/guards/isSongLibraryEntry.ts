import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { SongLibraryEntry } from "../song-library-types";

/**
 * Type guard to validate that a record has the minimal shape of a SongLibraryEntry.
 * Requires `song_id` and `user_id` fields. `song_owner_id` is a derived field.
 *
 * @param value - Value to check
 * @returns true if value has string `song_id` and `user_id`
 */
export default function isSongLibraryEntry(value: unknown): value is SongLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	const { song_id, user_id } = value;
	return isString(song_id) && isString(user_id);
}
