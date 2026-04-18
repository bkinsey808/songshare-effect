const LANGUAGE_TOKEN_PATTERN = /\{([a-zA-Z0-9-]+?)\}/g;

type LanguageTokenSelection = Readonly<{
	token: string;
	tokenStart: number;
	tokenEnd: number;
	languageCode: string;
}>;

/**
 * Converts a regex match into a normalized language-token payload.
 *
 * @param match - Regex match produced by `LANGUAGE_TOKEN_PATTERN`
 * @returns Parsed token metadata, or undefined when the match is incomplete
 */
function toLanguageTokenSelection(match: RegExpMatchArray): LanguageTokenSelection | undefined {
	const [token, languageCode] = match;
	const tokenStart = match.index;

	if (tokenStart === undefined || languageCode === undefined) {
		return undefined;
	}

	return {
		token,
		tokenStart,
		tokenEnd: tokenStart + token.length,
		languageCode,
	};
}

/**
 * Finds the language token that applies at the current text selection.
 *
 * For a collapsed caret, this first checks for a token under the caret and
 * then falls back to the nearest earlier language token, which represents the
 * active language at the insertion point. For a range selection, only tokens
 * overlapping the selected range are considered.
 *
 * @param value - The full text content to search for language tokens
 * @param selectionStart - The start index of the cursor/selection, or undefined if unavailable
 * @param selectionEnd - The end index of the cursor/selection, or undefined if unavailable
 * @returns The matched language token with its position and parsed data, or undefined
 */
export default function findLanguageTokenAtSelection({
	value,
	selectionStart,
	selectionEnd,
}: Readonly<{
	value: string;
	selectionStart: number | undefined;
	selectionEnd: number | undefined;
}>): LanguageTokenSelection | undefined {
	if (selectionStart === undefined || selectionEnd === undefined) {
		return undefined;
	}

	const isCollapsedSelection = selectionStart === selectionEnd;
	let previousToken: LanguageTokenSelection | undefined = undefined;

	for (const match of value.matchAll(LANGUAGE_TOKEN_PATTERN)) {
		const languageToken = toLanguageTokenSelection(match);
		if (languageToken !== undefined) {
			const overlapsToken = isCollapsedSelection
				? selectionStart >= languageToken.tokenStart && selectionStart < languageToken.tokenEnd
				: selectionStart < languageToken.tokenEnd && selectionEnd > languageToken.tokenStart;

			if (overlapsToken) {
				return languageToken;
			}

			if (isCollapsedSelection && languageToken.tokenEnd <= selectionStart) {
				previousToken = languageToken;
			}
		}
	}

	if (isCollapsedSelection) {
		return previousToken;
	}

	return undefined;
}
