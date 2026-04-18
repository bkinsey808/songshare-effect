/**
 * Chooses which grid field's language list should drive the slide-name pulldown.
 *
 * The active field wins when it is visible. Otherwise this falls back to the
 * only visible field, or to the field that currently has a selected language
 * token when both grids are available.
 *
 * @param activeLanguageField - Field whose textarea was active most recently
 * @param hasLyrics - Whether the row includes a lyrics grid
 * @param hasScript - Whether the row includes a script grid
 * @param lyricsSelectedLanguageCode - Selected lyrics language token at the caret, if any
 * @param scriptSelectedLanguageCode - Selected script language token at the caret, if any
 * @returns The field whose languages should populate the dropdown
 */
export default function computeCurrentLanguageField({
	activeLanguageField,
	hasLyrics,
	hasScript,
	lyricsSelectedLanguageCode,
	scriptSelectedLanguageCode,
}: Readonly<{
	activeLanguageField: "lyrics" | "script" | undefined;
	hasLyrics: boolean;
	hasScript: boolean;
	lyricsSelectedLanguageCode: string | undefined;
	scriptSelectedLanguageCode: string | undefined;
}>): "lyrics" | "script" {
	const hasSelectedLyricsLanguage =
		lyricsSelectedLanguageCode !== undefined && lyricsSelectedLanguageCode !== "";
	const hasSelectedScriptLanguage =
		scriptSelectedLanguageCode !== undefined && scriptSelectedLanguageCode !== "";

	if (activeLanguageField === "lyrics" && hasLyrics) {
		return "lyrics";
	}

	if (activeLanguageField === "script" && hasScript) {
		return "script";
	}

	if (hasLyrics && !hasScript) {
		return "lyrics";
	}

	if (hasScript && !hasLyrics) {
		return "script";
	}

	if (hasSelectedScriptLanguage && !hasSelectedLyricsLanguage) {
		return "script";
	}

	return "lyrics";
}
