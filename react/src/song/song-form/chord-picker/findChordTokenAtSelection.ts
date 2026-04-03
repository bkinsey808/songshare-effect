import { parseChordTokenBody, type ParsedChordToken } from "@/shared/music/chord-display";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;

type ChordTokenSelection = Readonly<{
	token: string;
	tokenStart: number;
	tokenEnd: number;
	parsedToken: ParsedChordToken;
}>;

export default function findChordTokenAtSelection({
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

	for (const match of value.matchAll(CHORD_TOKEN_PATTERN)) {
		const [token, tokenBody] = match;
		const tokenStart = match.index;
		if (tokenStart !== undefined && tokenBody !== undefined) {
			const parsedToken = parseChordTokenBody(tokenBody);
			if (parsedToken !== undefined) {
				const tokenEnd = tokenStart + token.length;
				const isCollapsedSelection = selectionStart === selectionEnd;
				const overlapsToken = isCollapsedSelection
					? selectionStart >= tokenStart && selectionStart < tokenEnd
					: selectionStart < tokenEnd && selectionEnd > tokenStart;

				if (overlapsToken) {
					return {
						token,
						tokenStart,
						tokenEnd,
						parsedToken,
					};
				}
			}
		}
	}

	return undefined;
}

export type { ChordTokenSelection };
