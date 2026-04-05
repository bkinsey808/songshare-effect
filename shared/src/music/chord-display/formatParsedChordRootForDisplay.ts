import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import formatChordRootForDisplay from "./formatChordRootForDisplay";
import getAbsoluteRootFromRomanDegree from "./getAbsoluteRootFromRomanDegree";
import type { ParsedChordToken } from "./ParsedChordToken.type";

/**
 * Formats a parsed token root into the active display notation.
 *
 * @param token - Parsed chord token whose root should be displayed
 * @param chordDisplayMode - Display mode to apply to the root
 * @param songKey - Song key used for relative-root conversion
 * @returns Display-ready root label
 */
export default function formatParsedChordRootForDisplay({
	token,
	chordDisplayMode,
	songKey,
}: Readonly<{
	token: ParsedChordToken;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "" | null | undefined;
}>): string {
	if (token.rootType === "absolute") {
		return formatChordRootForDisplay({
			root: token.root,
			chordDisplayMode,
			songKey,
		});
	}

	if (chordDisplayMode === "roman") {
		return token.root;
	}

	const absoluteRoot = getAbsoluteRootFromRomanDegree(token.root, songKey);
	if (absoluteRoot === undefined) {
		return token.root;
	}

	return formatChordRootForDisplay({
		root: absoluteRoot,
		chordDisplayMode,
		songKey,
	});
}
