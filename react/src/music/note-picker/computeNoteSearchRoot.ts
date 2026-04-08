import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/sciIntervalConstants";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { SongKey } from "@/shared/song/songKeyOptions";

import { filterSpellingByNoteSearch } from "./filterShapeByNoteSearch";

/**
 * Returns the first SongKey at which a spelling satisfies the current note search
 * constraints. Returns undefined when no required notes constrain the search.
 */
export default function computeNoteSearchRoot(
	spelling: string,
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): SongKey | undefined {
	const hasRequired = [...noteSearchState.values()].some((state) => state === "required");
	if (!hasRequired) {
		return undefined;
	}
	for (let rootSemitone = 0; rootSemitone < OCTAVE_SEMITONE_COUNT; rootSemitone++) {
		if (filterSpellingByNoteSearch(spelling, rootSemitone, noteSearchState)) {
			return songKeysBySemitone[rootSemitone];
		}
	}
	return undefined;
}
