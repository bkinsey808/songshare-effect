import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import absoluteRootByRomanDegree from "./absoluteRootByRomanDegree";
import rootSemitoneMap from "./rootSemitoneMap";
import type { RomanDegree } from "./RomanDegree.type";
import songKeysBySemitone from "./songKeysBySemitone";

const OCTAVE_SEMITONE_COUNT = 12;

/**
 * Resolves a roman-degree root back into an absolute root for the current song key.
 *
 * @param romanDegree - Relative root to resolve
 * @param songKey - Song key used as the tonic reference
 * @returns Absolute root when the song key is available
 */
export default function getAbsoluteRootFromRomanDegree(
	romanDegree: RomanDegree,
	songKey: SongKey | "" | null | undefined,
): SongKey | undefined {
	const relativeRoot = absoluteRootByRomanDegree[romanDegree];
	if (!isSongKey(songKey)) {
		return undefined;
	}

	const tonicSemitone = rootSemitoneMap[songKey];
	const relativeSemitone = rootSemitoneMap[relativeRoot];
	const absoluteSemitone = (tonicSemitone + relativeSemitone) % OCTAVE_SEMITONE_COUNT;

	return songKeysBySemitone[absoluteSemitone];
}
