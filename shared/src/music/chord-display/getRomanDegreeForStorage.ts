import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import formatRomanDegree from "./formatRomanDegree";
import isRomanDegree from "./isRomanDegree";
import type { RomanDegree } from "./RomanDegree.type";

/**
 * Computes the roman-degree representation used for storage when a song key exists.
 *
 * @param root - Absolute root to convert
 * @param songKey - Song key used as the tonic reference
 * @returns Roman-degree root for storage, if one can be derived
 */
export default function getRomanDegreeForStorage(
	root: SongKey,
	songKey: SongKey | "" | null | undefined,
): RomanDegree | undefined {
	if (!isSongKey(songKey)) {
		return undefined;
	}

	const romanDegree = formatRomanDegree(root, songKey);
	return isRomanDegree(romanDegree) ? romanDegree : undefined;
}
