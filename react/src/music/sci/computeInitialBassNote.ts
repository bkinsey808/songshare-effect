import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import parseInitialSciToken from "@/react/music/sci/parseInitialSciToken";

const SLASH_SEPARATOR = "/";
const NOT_FOUND = -1;
const AFTER_SLASH_OFFSET = 1;

/**
 * Extracts the bass note from the stored chord shape code when the token
 * was saved as a slash chord (e.g. "[C M/E]" yields "E").
 *
 * @param initialChordToken - Existing chord token when editing
 * @returns Bass note as a SongKey when present, or undefined for root-position chords
 */
export default function computeInitialBassNote({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): SongKey | undefined {
	const rawShapeCode = parseInitialSciToken(initialChordToken)?.shapeCode;
	if (rawShapeCode === undefined) {
		return undefined;
	}

	const slashIndex = rawShapeCode.indexOf(SLASH_SEPARATOR);
	if (slashIndex === NOT_FOUND) {
		return undefined;
	}

	const bassNote = rawShapeCode.slice(slashIndex + AFTER_SLASH_OFFSET);
	return isSongKey(bassNote) ? bassNote : undefined;
}
