import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import displayedRootByMode from "./displayedRootByMode";
import formatRomanDegree from "./formatRomanDegree";

/**
 * Formats an absolute chord root for the requested notation system.
 *
 * @param root - Absolute chord root to render
 * @param chordDisplayMode - Display mode to apply
 * @param songKey - Song key used when computing roman numerals
 * @returns Display-ready root label
 */
export default function formatChordRootForDisplay({
	root,
	chordDisplayMode,
	songKey,
}: Readonly<{
	root: SongKey;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "" | null | undefined;
}>): string {
	if (chordDisplayMode === "roman") {
		return formatRomanDegree(root, songKey);
	}

	return displayedRootByMode[chordDisplayMode][root];
}
