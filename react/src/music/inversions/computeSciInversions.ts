import {
	INTERVAL_SEMITONE_OFFSET,
	OCTAVE_SEMITONE_COUNT,
	SEMITONE_INTERVAL_LABELS,
} from "@/react/music/intervals/interval-constants";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import { getChordShapeByCode, getChordShapes, type ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

const ORDINAL_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"] as const;
const ROOT_OFFSET = 0;
const INVERSION_START_INDEX = 1;
const ORDINAL_INDEX_OFFSET = 1;

type SciInversion = Readonly<{
	/** 1-based inversion number (1 = first inversion, 2 = second, etc.) */
	inversionNumber: number;
	/** "1st", "2nd", etc. */
	ordinalLabel: string;
	/** The original chord root, shared across all inversions in the set */
	originalRoot: SongKey;
	/** The new bass note (SongKey) */
	bassRoot: SongKey;
	/** Interval labels from the new bass root's perspective, e.g. "b3,b6" */
	reRootedSpelling: string;
	/** Matching SCI chord shape when the re-rooted spelling is a known chord */
	matchedShape?: ChordShape;
}>;

type InversionCandidate = Readonly<{
	inversionIndex: number;
	bassRoot: SongKey;
	reRootedSpelling: string;
}>;

/**
 * Computes all standard inversions of a chord given its root and shape.
 *
 * Each inversion re-roots the chord on the next non-root tone, producing a
 * chord with the same pitch classes but a different bass note.
 *
 * @param absoluteRoot - The chord root as an absolute SongKey (e.g. "C")
 * @param shapeCode - The chord shape code (e.g. "M", "m", "M7")
 * @returns Array of inversions in ascending order, excluding root position
 */
export default function computeSciInversions(
	absoluteRoot: SongKey,
	shapeCode: string,
): readonly SciInversion[] {
	const shape = getChordShapeByCode(shapeCode);
	if (shape === undefined || shape.spelling === "") {
		return [];
	}

	const rootSemitone = rootSemitoneMap[absoluteRoot];

	// Build all semitone offsets for this chord (root = 0 plus each non-root interval).
	const nonRootOffsets = shape.spelling
		.split(",")
		.map((interval) => interval.trim())
		.map((interval) => INTERVAL_SEMITONE_OFFSET[interval])
		.filter((offset): offset is number => offset !== undefined);

	const allOffsets = [ROOT_OFFSET, ...nonRootOffsets];

	// Each non-root offset becomes a new bass note for an inversion.
	const candidates: readonly (InversionCandidate | undefined)[] = nonRootOffsets.map(
		(inversionOffset, idx) => {
			const inversionIndex = idx + INVERSION_START_INDEX;

			// Recompute all intervals relative to the new bass note.
			const reRootedOffsets = allOffsets
				.filter((offset) => offset !== inversionOffset)
				.map((offset) => (offset - inversionOffset + OCTAVE_SEMITONE_COUNT) % OCTAVE_SEMITONE_COUNT)
				.toSorted((offsetA, offsetB) => offsetA - offsetB);

			// Convert semitone offsets back to interval labels.
			const reRootedIntervals = reRootedOffsets.map((offset) => SEMITONE_INTERVAL_LABELS[offset]);

			if (reRootedIntervals.some((label) => label === undefined)) {
				return undefined;
			}

			const newRootSemitone = (rootSemitone + inversionOffset) % OCTAVE_SEMITONE_COUNT;
			const bassRoot = songKeysBySemitone[newRootSemitone];

			if (bassRoot === undefined) {
				return undefined;
			}

			return {
				inversionIndex,
				bassRoot,
				reRootedSpelling: reRootedIntervals.join(","),
			} satisfies InversionCandidate;
		},
	);

	return candidates
		.filter((candidate): candidate is InversionCandidate => candidate !== undefined)
		.map(({ inversionIndex, bassRoot, reRootedSpelling }): SciInversion => {
			const ordinalLabel =
				ORDINAL_LABELS[inversionIndex - ORDINAL_INDEX_OFFSET] ?? `${String(inversionIndex)}th`;
			const matchedShape = getChordShapes().find(
				(sciShape) => sciShape.spelling === reRootedSpelling,
			);
			if (matchedShape === undefined) {
				return {
					inversionNumber: inversionIndex,
					ordinalLabel,
					originalRoot: absoluteRoot,
					bassRoot,
					reRootedSpelling,
				};
			}
			return {
				inversionNumber: inversionIndex,
				ordinalLabel,
				originalRoot: absoluteRoot,
				bassRoot,
				reRootedSpelling,
				matchedShape,
			};
		});
}

export type { SciInversion };
