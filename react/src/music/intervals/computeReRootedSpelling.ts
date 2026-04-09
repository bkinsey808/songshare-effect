import { OCTAVE_SEMITONE_COUNT, SEMITONE_INTERVAL_LABELS } from "./interval-constants";

/**
 * Derives the interval spelling when the note set is re-rooted on a different tone.
 *
 * @param allOffsets - All semitone offsets in the chord, including root (0)
 * @param candidateRootOffset - Offset of the note to treat as the new root
 * @returns Comma-separated interval labels relative to the new root, or undefined if any
 *   semitone has no label in SEMITONE_INTERVAL_LABELS
 */
export default function computeReRootedSpelling(
	allOffsets: readonly number[],
	candidateRootOffset: number,
): string | undefined {
	const reRootedOffsets = allOffsets
		.filter((offset) => offset !== candidateRootOffset)
		.map((offset) => (offset - candidateRootOffset + OCTAVE_SEMITONE_COUNT) % OCTAVE_SEMITONE_COUNT)
		.toSorted((offsetA, offsetB) => offsetA - offsetB);

	const reRootedIntervals = reRootedOffsets.map((offset) => SEMITONE_INTERVAL_LABELS[offset]);
	if (reRootedIntervals.some((label) => label === undefined)) {
		return undefined;
	}
	return reRootedIntervals.join(",");
}
