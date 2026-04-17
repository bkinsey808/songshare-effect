import isString from "@/shared/type-guards/isString";

/**
 * Derive the ordered list of active language codes from a public song object.
 *
 * Returns `[lyrics, script?, ...translations]` using the new language-based
 * schema. Falls back to an empty array when the required `lyrics` field is
 * absent or not a string.
 *
 * @param pub - An optional object that may contain `lyrics`, `script`, and
 *   `translations` properties sourced from the public song record.
 * @returns An ordered array of BCP 47 language codes active for this song.
 */
export default function computeFieldsArray(pub?: Record<string, unknown>): string[] {
	if (pub === undefined) {
		return [];
	}
	const { lyrics, script, translations } = pub;
	if (!isString(lyrics) || lyrics === "") {
		return [];
	}
	const translationCodes: string[] = Array.isArray(translations)
		? translations.filter((value): value is string => isString(value))
		: [];
	return [lyrics, ...(isString(script) && script !== "" ? [script] : []), ...translationCodes];
}
