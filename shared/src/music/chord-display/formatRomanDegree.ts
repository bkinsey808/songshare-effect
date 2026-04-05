import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import displayedRootByMode from "./displayedRootByMode";
import romanDegreeBySemitone from "./romanDegreeBySemitone";
import rootSemitoneMap from "./rootSemitoneMap";

const OCTAVE_SEMITONE_COUNT = 12;
const DEFAULT_TONIC: SongKey = "C";

/**
 * Converts an absolute root into a roman-degree label relative to the song key.
 *
 * @param root - Absolute chord root
 * @param songKey - Song key used as the tonic reference
 * @returns Roman-degree label using the song key, or `C` as a neutral tonic when no key is available
 */
export default function formatRomanDegree(
	root: SongKey,
	songKey: SongKey | "" | null | undefined,
): string {
	const rootSemitone = rootSemitoneMap[root];
	const tonicSemitone = rootSemitoneMap[isSongKey(songKey) ? songKey : DEFAULT_TONIC];
	const relativeSemitone =
		(rootSemitone - tonicSemitone + OCTAVE_SEMITONE_COUNT) % OCTAVE_SEMITONE_COUNT;

	return romanDegreeBySemitone[relativeSemitone] ?? displayedRootByMode.letters[root];
}
