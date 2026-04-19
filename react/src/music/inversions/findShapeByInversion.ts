import computeReRootedSpelling from "@/react/music/intervals/computeReRootedSpelling";
import { INTERVAL_SEMITONE_OFFSET } from "@/react/music/intervals/interval-constants";
import { getChordShapes, type ChordShape } from "@/shared/music/chord-shapes";

/** Semitone offset of the chord root (always zero relative to itself). */
const ROOT_SEMITONE_OFFSET = 0;

/** Start index after root when slicing the full offset array. */
const NON_ROOT_OFFSET_START = 1;

type InversionMatch = Readonly<{

	/** Catalog shape whose spelling matches a rotation of the given interval set. */
	shape: ChordShape;

	/** Semitone offset (relative to the original root) of the matched shape's root. */
	inversionRootOffset: number;
}>;

/**
 * Determines whether a chord spelling is an inversion of any catalog shape.
 *
 * For each interval in the spelling, re-roots the full note set on that interval
 * and checks whether the resulting relative spelling exists in the chord catalog.
 * Returns the first match found, or undefined when no rotation matches.
 *
 * @param spelling - Comma-separated interval labels (root "1" excluded), e.g. "b3,b5,5"
 * @returns Catalog shape and the offset of its root within the original spelling, or undefined
 */
export default function findShapeByInversion(spelling: string): InversionMatch | undefined {
	if (spelling === "") {
		return undefined;
	}

	const nonRootIntervals = spelling.split(",").map((interval) => interval.trim());

	// Build the offset array, returning early if any interval label is unrecognised.
	const allSemitoneOffsets: number[] = [ROOT_SEMITONE_OFFSET];
	for (const interval of nonRootIntervals) {
		const offset = INTERVAL_SEMITONE_OFFSET[interval];
		if (offset === undefined) {
			return undefined;
		}
		allSemitoneOffsets.push(offset);
	}

	const nonRootOffsets = allSemitoneOffsets.slice(NON_ROOT_OFFSET_START);

	for (const candidateRootOffset of nonRootOffsets) {
		const reRootedSpelling = computeReRootedSpelling(allSemitoneOffsets, candidateRootOffset);
		const catalogShape =
			reRootedSpelling === undefined
				? undefined
				: getChordShapes().find((shape) => shape.spelling === reRootedSpelling);
		if (catalogShape !== undefined) {
			return { shape: catalogShape, inversionRootOffset: candidateRootOffset };
		}
	}

	return undefined;
}
