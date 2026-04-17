/* oxlint-disable @typescript-eslint/no-magic-numbers */
import deriveSongFieldKeys from "./deriveSongFieldKeys";

type NormalizeSlideFieldDataParams = Readonly<{
	fieldData: Readonly<Record<string, string>>;
	lyrics: readonly string[];
	script?: readonly string[] | undefined;
	translations: readonly string[];
}>;

const LEGACY_TRANSLATION_KEY = "enTranslation";

/**
 * Normalize slide `field_data` to the current language-keyed shape.
 *
 * Current keys ("lyrics", "script", and BCP47 codes for translations) win when present. 
 * Legacy keys are used only as a fallback so older rows and in-memory editor state 
 * can be upgraded without losing content.
 *
 * @param fieldData - Existing slide field map from the DB or form state.
 * @param lyrics - Lyrics language codes for the song.
 * @param script - Optional script language codes for the song.
 * @param translations - Ordered translation language codes for the song.
 * @returns A normalized field map containing only the current keys.
 */
export default function normalizeSlideFieldData({
	fieldData,
	lyrics,
	script,
	translations,
}: NormalizeSlideFieldDataParams): Record<string, string> {
	const normalizedFieldData: Record<string, string> = {};
	const orderedFieldKeys = deriveSongFieldKeys({
		lyrics,
		script,
		translations,
	});

	for (const fieldKey of orderedFieldKeys) {
		normalizedFieldData[fieldKey] = fieldData[fieldKey] ?? "";
	}

	// Fallback from the brief period where we used the BCP47 code as the lyrics key
	if (lyrics.length > 0 && normalizedFieldData["lyrics"] === "") {
		for (const code of lyrics) {
			const fallback = fieldData[code];
			if (fallback !== undefined && fallback !== "") {
				normalizedFieldData["lyrics"] = fallback;
				break;
			}
		}
	}

	// Fallback from the brief period where we used the BCP47 code as the script key
	if (script !== undefined && script.length > 0 && normalizedFieldData["script"] === "") {
		for (const code of script) {
			const fallback = fieldData[code];
			if (fallback !== undefined && fallback !== "") {
				normalizedFieldData["script"] = fallback;
				break;
			}
		}
	}

	const [firstTranslation] = translations;
	if (firstTranslation !== undefined && normalizedFieldData[firstTranslation] === "") {
		normalizedFieldData[firstTranslation] = fieldData[LEGACY_TRANSLATION_KEY] ?? "";
	}

	return normalizedFieldData;
}
