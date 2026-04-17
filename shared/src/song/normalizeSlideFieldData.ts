import deriveSongFieldKeys from "./deriveSongFieldKeys";

type NormalizeSlideFieldDataParams = Readonly<{
	fieldData: Readonly<Record<string, string>>;
	lyrics: string;
	script?: string | undefined;
	translations: readonly string[];
}>;

const LEGACY_LYRICS_KEY = "lyrics";
const LEGACY_SCRIPT_KEY = "script";
const LEGACY_TRANSLATION_KEY = "enTranslation";

/**
 * Normalize slide `field_data` to the current language-keyed shape.
 *
 * Current language-code keys win when present. Legacy keys are used only as a
 * fallback so older rows and in-memory editor state can be upgraded without
 * losing content.
 *
 * @param fieldData - Existing slide field map from the DB or form state.
 * @param lyrics - Lyrics language code for the song.
 * @param script - Optional script language code for the song.
 * @param translations - Ordered translation language codes for the song.
 * @returns A normalized field map containing only the current language keys.
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

	if (normalizedFieldData[lyrics] === "") {
		normalizedFieldData[lyrics] = fieldData[LEGACY_LYRICS_KEY] ?? "";
	}

	if (script !== undefined && normalizedFieldData[script] === "") {
		normalizedFieldData[script] = fieldData[LEGACY_SCRIPT_KEY] ?? "";
	}

	const [firstTranslation] = translations;
	if (firstTranslation !== undefined && normalizedFieldData[firstTranslation] === "") {
		normalizedFieldData[firstTranslation] = fieldData[LEGACY_TRANSLATION_KEY] ?? "";
	}

	return normalizedFieldData;
}
