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
export default function filterAbsolutesByNoteSearch(
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
