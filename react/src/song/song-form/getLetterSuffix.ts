import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import parseChordTokenBody from "@/shared/music/chord-display/parseChordTokenBody";
import type { SongKey } from "@/shared/song/songKeyOptions";

const BRACKET_START = 1;
const BRACKET_END = -1;

/**
 * Returns the letter chord root in parentheses when the token uses a roman-degree
 * root and a song key is available, otherwise returns an empty string.
 *
 * @param token - Stored chord token (e.g. "[I M]" or "[C M]")
 * @param songKey - Active song key, or empty string when none is set
 * @returns Parenthetical letter label like " (C)" or empty string
 */
export default function getLetterSuffix(token: string, songKey: SongKey | ""): string {
	if (songKey === "") {
		return "";
	}
	const body = token.startsWith("[") && token.endsWith("]")
		? token.slice(BRACKET_START, BRACKET_END)
		: token;
	const parsed = parseChordTokenBody(body);
	if (parsed === undefined || parsed.rootType !== "roman") {
		return "";
	}
	const absoluteRoot = getAbsoluteRootFromRomanDegree(parsed.root, songKey);
	return absoluteRoot === undefined ? "" : ` (${absoluteRoot})`;
}
