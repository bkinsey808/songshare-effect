import computeAbsoluteSemitones from "@/react/music/intervals/computeAbsoluteSemitones";
import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/interval-constants";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import type { ChordShape } from "@/shared/music/chord-shapes";

import filterAbsolutesByNoteSearch from "./filterAbsolutesByNoteSearch";

/**
 * Returns whether a chord shape satisfies all note search constraints for ANY root.
 *
 * Tries all 12 possible roots to determine if the shape's pitch class set can
 * include all required absolute semitones and exclude all excluded ones.
 *
 * noteSearchState keys are absolute semitones (0–11, C=0).
 *
 * @param shape - Chord shape to evaluate
 * @param noteSearchState - Map from absolute semitone to required/excluded state
 * @returns True when at least one rooting satisfies all constraints
 */
export default function filterShapeByNoteSearch(
	shape: ChordShape,
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): boolean {
	for (let root = 0; root < OCTAVE_SEMITONE_COUNT; root++) {
		if (
			filterAbsolutesByNoteSearch(computeAbsoluteSemitones(shape.spelling, root), noteSearchState)
		) {
			return true;
		}
	}
	return false;
}
