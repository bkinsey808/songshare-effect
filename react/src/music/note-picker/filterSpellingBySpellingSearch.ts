import computeAbsoluteSemitones from "@/react/music/intervals/computeAbsoluteSemitones";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

import filterAbsolutesByNoteSearch from "./filterAbsolutesByNoteSearch";

const RELATIVE_ROOT_SEMITONE = 0;

/**
 * Returns whether an interval spelling satisfies the active spelling-search constraints.
 *
 * The search state is keyed by semitone offsets relative to the chord root, so the
 * spelling can be evaluated by treating the root as semitone 0.
 *
 * @param spelling - Comma-separated non-root interval labels, e.g. "b3,5"
 * @param spellingSearchState - Map from relative semitone offset to required/excluded state
 * @returns True when all required spellings are present and no excluded spellings are present
 */
export default function filterSpellingBySpellingSearch(
	spelling: string,
	spellingSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): boolean {
	return filterAbsolutesByNoteSearch(
		computeAbsoluteSemitones(spelling, RELATIVE_ROOT_SEMITONE),
		spellingSearchState,
	);
}
