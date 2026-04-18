import parseChordTokenBody from "@/shared/music/chord-display/parseChordTokenBody";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;

/**
 * Finds the distinct valid chord tokens present in a lyrics value.
 *
 * Tokens are returned in first-appearance order and duplicate chord tokens are
 * collapsed so the dropdown stays concise.
 *
 * @param value - Full lyrics text to scan for chord tokens
 * @returns Distinct valid chord tokens in first-appearance order
 */
export default function findChordTokens(value: string): readonly string[] {
	const chordTokens: string[] = [];
	const seenTokens = new Set<string>();

	for (const match of value.matchAll(CHORD_TOKEN_PATTERN)) {
		const [token, tokenBody] = match;
		if (
			tokenBody !== undefined &&
			parseChordTokenBody(tokenBody) !== undefined &&
			!seenTokens.has(token)
		) {
			seenTokens.add(token);
			chordTokens.push(token);
		}
	}

	return chordTokens;
}
