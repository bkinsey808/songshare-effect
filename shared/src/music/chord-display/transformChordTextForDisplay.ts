import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import formatParsedChordRootForDisplay from "./formatParsedChordRootForDisplay";
import parseChordTokenBody from "./parseChordTokenBody";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;
const BASS_NOTE_SEPARATOR = "/";
const BASS_NOTE_OFFSET = 1;
const NOT_FOUND = -1;
const SHAPE_START = 0;

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

		if (parsed.shapeCode === "") {
			return `[${displayedRoot}]`;
		}

		const slashIndex = parsed.shapeCode.indexOf(BASS_NOTE_SEPARATOR);
		if (slashIndex === NOT_FOUND) {
			return `[${displayedRoot} ${parsed.shapeCode}]`;
		}

		const baseShapeCode = parsed.shapeCode.slice(SHAPE_START, slashIndex);
		const bassNoteStr = parsed.shapeCode.slice(slashIndex + BASS_NOTE_OFFSET);
		if (!isSongKey(bassNoteStr)) {
			return `[${displayedRoot} ${parsed.shapeCode}]`;
		}

		const displayedBassNote = formatParsedChordRootForDisplay({
			token: { root: bassNoteStr, rootType: "absolute", shapeCode: "" },
			chordDisplayMode: params.chordDisplayMode,
			songKey: params.songKey,
		});

		return `[${displayedRoot} ${baseShapeCode}${BASS_NOTE_SEPARATOR}${displayedBassNote}]`;
	});
}
