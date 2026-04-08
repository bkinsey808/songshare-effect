import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/sciIntervalConstants";
import computeAbsoluteSemitones from "@/react/music/intervals/computeAbsoluteSemitones";
import type { ChordShape } from "@/shared/music/chord-shapes";

import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const EMPTY_LENGTH = 0;

/**
 * Returns whether a set of absolute semitones satisfies note search constraints.
 *
 * noteSearchState keys are absolute semitones (0–11, C=0). All required semitones
 * must be present; all excluded semitones must be absent.
 *
 * @param absoluteSemitones - Absolute pitch classes present in the chord
 * @param noteSearchState - Map from absolute semitone to required/excluded state
 * @returns True when all constraints are satisfied
 */
function filterAbsolutesByNoteSearch(
	absoluteSemitones: Set<number>,
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): boolean {
	const requiredSemitones: number[] = [];
	const excludedSemitones: number[] = [];
	for (const [semitone, state] of noteSearchState) {
		if (state === "required") {
			requiredSemitones.push(semitone);
		} else if (state === "excluded") {
			excludedSemitones.push(semitone);
		}
	}
	if (requiredSemitones.length === EMPTY_LENGTH && excludedSemitones.length === EMPTY_LENGTH) {
		return true;
	}
	return (
		requiredSemitones.every((semitone) => absoluteSemitones.has(semitone)) &&
		excludedSemitones.every((semitone) => !absoluteSemitones.has(semitone))
	);
}

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
export function filterSpellingByNoteSearch(
	spelling: string,
	bassRootSemitone: number,
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>,
): boolean {
	return filterAbsolutesByNoteSearch(
		computeAbsoluteSemitones(spelling, bassRootSemitone),
		noteSearchState,
	);
}

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
