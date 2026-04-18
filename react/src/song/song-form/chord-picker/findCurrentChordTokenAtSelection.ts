import parseChordTokenBody from "@/shared/music/chord-display/parseChordTokenBody";
import type { ParsedChordToken } from "@/shared/music/chord-display/ParsedChordToken.type";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;

type ChordTokenSelection = Readonly<{
	token: string;
	tokenStart: number;
	tokenEnd: number;
	parsedToken: ParsedChordToken;
}>;

/**
 * Converts a regex match into a normalized chord-token payload.
 *
 * @param match - Regex match produced by `CHORD_TOKEN_PATTERN`
 * @returns Parsed token metadata, or undefined when the token is invalid
 */
function toChordTokenSelection(match: RegExpMatchArray): ChordTokenSelection | undefined {
	const [token, tokenBody] = match;
	const tokenStart = match.index;
	if (tokenStart === undefined || tokenBody === undefined) {
		return undefined;
	}

	const parsedToken = parseChordTokenBody(tokenBody);
	if (parsedToken === undefined) {
		return undefined;
	}

	return {
		token,
		tokenStart,
		tokenEnd: tokenStart + token.length,
		parsedToken,
	};
}

/**
 * Finds the chord token that should be shown for the current insertion point.
 *
 * For a collapsed caret, this first checks for a chord token under the caret
 * and then falls back to the nearest earlier chord token. For a range
 * selection, only tokens overlapping that range are considered.
 *
 * @param value - Full lyrics text to search for chord tokens
 * @param selectionStart - Selection start offset, or undefined if unavailable
 * @param selectionEnd - Selection end offset, or undefined if unavailable
 * @returns The chord token under or before the current insertion point, or undefined
 */
export default function findCurrentChordTokenAtSelection({
	value,
	selectionStart,
	selectionEnd,
}: Readonly<{
	value: string;
	selectionStart: number | undefined;
	selectionEnd: number | undefined;
}>): ChordTokenSelection | undefined {
	if (selectionStart === undefined || selectionEnd === undefined) {
		return undefined;
	}

	const isCollapsedSelection = selectionStart === selectionEnd;
	let previousToken: ChordTokenSelection | undefined = undefined;

	for (const match of value.matchAll(CHORD_TOKEN_PATTERN)) {
		const chordToken = toChordTokenSelection(match);
		if (chordToken !== undefined) {
			const overlapsToken = isCollapsedSelection
				? selectionStart >= chordToken.tokenStart && selectionStart < chordToken.tokenEnd
				: selectionStart < chordToken.tokenEnd && selectionEnd > chordToken.tokenStart;

			if (overlapsToken) {
				return chordToken;
			}

			if (isCollapsedSelection && chordToken.tokenEnd <= selectionStart) {
				previousToken = chordToken;
			}
		}
	}

	if (isCollapsedSelection) {
		return previousToken;
	}

	return undefined;
}
