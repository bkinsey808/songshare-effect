import { INTERVAL_SEMITONE_OFFSET, OCTAVE_SEMITONE_COUNT } from "./interval-constants";

const ROOT_INTERVAL_OFFSET = 0;

/**
 * Returns the set of absolute semitones (0–11) for a chord spelling rooted at a given semitone.
 *
 * @param spelling - Comma-separated interval labels for the non-root notes, e.g. "b3,5"
 * @param rootSemitone - Absolute semitone of the chord root (0–11)
 * @returns Set of absolute semitones present in the chord
 */
export default function computeAbsoluteSemitones(
	spelling: string,
	rootSemitone: number,
): Set<number> {
	const semitones = new Set<number>([
		(rootSemitone + ROOT_INTERVAL_OFFSET) % OCTAVE_SEMITONE_COUNT,
	]);
	if (spelling !== "") {
		for (const interval of spelling.split(",")) {
			const offset = INTERVAL_SEMITONE_OFFSET[interval];
			if (offset !== undefined) {
				semitones.add((rootSemitone + offset) % OCTAVE_SEMITONE_COUNT);
			}
		}
	}
	return semitones;
}
