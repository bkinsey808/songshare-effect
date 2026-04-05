import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import absoluteRootByRomanDegree from "./absoluteRootByRomanDegree";
import formatChordToken from "./formatChordToken";
import getRomanDegreeForStorage from "./getRomanDegreeForStorage";
import type { RomanDegree } from "./RomanDegree.type";

/**
 * Produces the canonical stored chord token for either an absolute or relative root.
 *
 * @param root - Root to serialize into the token
 * @param rootType - Whether the root is absolute or roman
 * @param shapeCode - Chord-shape suffix to preserve
 * @param songKey - Song key used to choose absolute versus relative storage
 * @returns Canonical bracketed chord token
 */
export default function formatStoredChordToken({
	root,
	rootType,
	shapeCode,
	songKey,
}:
	| Readonly<{
			root: RomanDegree;
			rootType: "roman";
			shapeCode: string;
			songKey: SongKey | "" | null | undefined;
	  }>
	| Readonly<{
			root: SongKey;
			rootType: "absolute";
			shapeCode: string;
			songKey: SongKey | "" | null | undefined;
	  }>): string {
	if (rootType === "roman") {
		if (isSongKey(songKey)) {
			return formatChordToken({
				root,
				rootType: "roman",
				shapeCode,
			});
		}

		return formatChordToken({
			root: absoluteRootByRomanDegree[root],
			rootType: "absolute",
			shapeCode,
		});
	}

	const storedRomanDegree = getRomanDegreeForStorage(root, songKey);
	if (storedRomanDegree !== undefined) {
		return formatChordToken({
			root: storedRomanDegree,
			rootType: "roman",
			shapeCode,
		});
	}

	return formatChordToken({
		root,
		rootType: "absolute",
		shapeCode,
	});
}
