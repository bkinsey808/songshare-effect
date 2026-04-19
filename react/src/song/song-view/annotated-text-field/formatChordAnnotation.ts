import formatParsedChordRootForDisplay from "@/shared/music/chord-display/formatParsedChordRootForDisplay";
import parseChordTokenBody from "@/shared/music/chord-display/parseChordTokenBody";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

type FormatChordAnnotationOptions = Readonly<{
	tokenBody: string;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | undefined;
}>;

const BASS_NOTE_SEPARATOR = "/";
const BASS_NOTE_OFFSET = 1;
const NOT_FOUND = -1;
const SHAPE_START = 0;

/**
 * Format a valid chord token body as a display string without surrounding brackets.
 *
 * @param tokenBody - Body of a chord token, excluding surrounding brackets
 * @param chordDisplayMode - Display mode to apply to chord roots
 * @param songKey - Song key used for transposition
 * @returns Formatted display string, or undefined when the token is unrecognized
 */
export default function formatChordAnnotation({
	tokenBody,
	chordDisplayMode,
	songKey,
}: FormatChordAnnotationOptions): string | undefined {
	const parsed = parseChordTokenBody(tokenBody);
	if (parsed === undefined) {
		return undefined;
	}

	const displayedRoot = formatParsedChordRootForDisplay({
		token: parsed,
		chordDisplayMode,
		songKey,
	});

	if (parsed.shapeCode === "") {
		return displayedRoot;
	}

	const slashIndex = parsed.shapeCode.indexOf(BASS_NOTE_SEPARATOR);
	if (slashIndex === NOT_FOUND) {
		return `${displayedRoot} ${parsed.shapeCode}`;
	}

	const baseShapeCode = parsed.shapeCode.slice(SHAPE_START, slashIndex);
	const bassNoteStr = parsed.shapeCode.slice(slashIndex + BASS_NOTE_OFFSET);
	if (!isSongKey(bassNoteStr)) {
		return `${displayedRoot} ${parsed.shapeCode}`;
	}

	const displayedBassNote = formatParsedChordRootForDisplay({
		token: { root: bassNoteStr, rootType: "absolute", shapeCode: "" },
		chordDisplayMode,
		songKey,
	});

	return `${displayedRoot} ${baseShapeCode}${BASS_NOTE_SEPARATOR}${displayedBassNote}`;
}
