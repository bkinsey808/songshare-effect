import computeAbsoluteSemitones from "@/react/music/intervals/computeAbsoluteSemitones";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

import filterAbsolutesByNoteSearch from "./filterAbsolutesByNoteSearch";

/**
 * Returns whether an interval spelling rooted at a specific bass note satisfies all note search
 * constraints. Used for filtering chord inversions where the bass root is known.
 *
 * noteSearchState keys are absolute semitones (0–11, C=0).
 *
 * @param spelling - Comma-separated non-root interval labels from the bass note, e.g. "b3,5"
 * @param bassRootSemitone - Absolute semitone of the bass note (0–11)
 * @param noteSearchState - Map from absolute semitone to required/excluded state
 * @returns True when all required semitones are present and no excluded semitones are present
 */
export default function filterSpellingByNoteSearch(
	spelling: string,
	bassRootSemitone: number,
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): boolean {
	return filterAbsolutesByNoteSearch(
		computeAbsoluteSemitones(spelling, bassRootSemitone),
		noteSearchState,
	);
}
