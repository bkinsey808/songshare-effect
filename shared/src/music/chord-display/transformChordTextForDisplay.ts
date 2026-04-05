import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import formatParsedChordRootForDisplay from "./formatParsedChordRootForDisplay";
import parseChordTokenBody from "./parseChordTokenBody";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;

/**
 * Rewrites each chord token in a text block for the requested display mode.
 *
 * @param text - Text that may contain bracketed chord tokens
 * @param params - Display mode and song key used to format token roots
 * @returns Text with recognized chord tokens reformatted for display
 */
export default function transformChordTextForDisplay(
	text: string,
	params: Readonly<{
		chordDisplayMode: ChordDisplayModeType;
		songKey: SongKey | "" | null | undefined;
	}>,
): string {
	if (!text.includes("[")) {
		return text;
	}

	return text.replace(CHORD_TOKEN_PATTERN, (fullMatch, tokenBody: string) => {
		const parsed = parseChordTokenBody(tokenBody);
		if (parsed === undefined) {
			return fullMatch;
		}

		const displayedRoot = formatParsedChordRootForDisplay({
			token: parsed,
			chordDisplayMode: params.chordDisplayMode,
			songKey: params.songKey,
		});

		return parsed.shapeCode === ""
			? `[${displayedRoot}]`
			: `[${displayedRoot} ${parsed.shapeCode}]`;
	});
}
