import { findLanguageByTag } from "@/shared/language/translationLanguages";

import computeCurrentLanguageField from "./computeCurrentLanguageField";

type SlideNameLanguageSelectProps = Readonly<{
	hasLyrics: boolean;
	hasScript: boolean;
	lyricsLanguages: readonly string[];
	scriptLanguages: readonly string[];
	activeLanguageField: "lyrics" | "script" | undefined;
	lyricsSelectedLanguageCode: string | undefined;
	onSelectLyricsLanguage: (code: string) => void;
	scriptSelectedLanguageCode: string | undefined;
	onSelectScriptLanguage: (code: string) => void;
}>;

const SINGLE_INSTANCE = 1;

/**
 * Renders the slide-name language pulldown for the active grid field.
 *
 * The dropdown shows only the languages for the field whose textarea was most
 * recently active in the grid. If only one field has multiple language options,
 * that field is shown automatically.
 *
 * @param hasLyrics - Whether the row includes a lyrics field
 * @param hasScript - Whether the row includes a script field
 * @param lyricsLanguages - Available lyrics language codes
 * @param scriptLanguages - Available script language codes
 * @param activeLanguageField - Field whose cursor/selection was active last
 * @param lyricsSelectedLanguageCode - Active lyrics language token at the caret, if any
 * @param onSelectLyricsLanguage - Applies a selected lyrics language token
 * @param scriptSelectedLanguageCode - Active script language token at the caret, if any
 * @param onSelectScriptLanguage - Applies a selected script language token
 * @returns A field-local language dropdown, or undefined when no dropdown is needed
 */
export default function SlideNameLanguageSelect({
	hasLyrics,
	hasScript,
	lyricsLanguages,
	scriptLanguages,
	activeLanguageField,
	lyricsSelectedLanguageCode,
	onSelectLyricsLanguage,
	scriptSelectedLanguageCode,
	onSelectScriptLanguage,
}: SlideNameLanguageSelectProps): ReactElement | undefined {
	if (!hasLyrics && !hasScript) {
		return undefined;
	}

	const currentLanguageField = computeCurrentLanguageField({
		activeLanguageField,
		hasLyrics,
		hasScript,
		lyricsSelectedLanguageCode,
		scriptSelectedLanguageCode,
	});

	const selectedLanguageCode =
		currentLanguageField === "lyrics"
			? (lyricsSelectedLanguageCode ?? "")
			: (scriptSelectedLanguageCode ?? "");
	const activeLanguageCodes = currentLanguageField === "lyrics" ? lyricsLanguages : scriptLanguages;
	if (activeLanguageCodes.length <= SINGLE_INSTANCE) {
		return undefined;
	}

	return (
		<select
			value={selectedLanguageCode}
			onChange={(event) => {
				const code = event.target.value;
				if (code === "") {
					return;
				}

				if (currentLanguageField === "lyrics") {
					onSelectLyricsLanguage(code);
				} else {
					onSelectScriptLanguage(code);
				}
			}}
			className="w-full cursor-pointer rounded border border-gray-600 bg-gray-800 px-1 py-1 text-xs text-gray-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
			data-testid="slide-name-language-select"
		>
			<option value="" disabled hidden>
				Language
			</option>
			{activeLanguageCodes.map((languageCode) => {
				const language = findLanguageByTag(languageCode);
				return (
					<option key={languageCode} value={languageCode} className="bg-gray-900 text-gray-200">
						{language ? language.name : languageCode}
					</option>
				);
			})}
		</select>
	);
}
