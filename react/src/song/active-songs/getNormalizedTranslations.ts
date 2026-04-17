import { LEGACY_TRANSLATION_LANGUAGE, MIN_STRING_LENGTH } from "./constants";
import hasLegacyEnglishTranslation from "./hasLegacyEnglishTranslation";

/**
 * Resolve the canonical translations array for a song record.
 *
 * The function prefers an explicit `song.translations` array when present
 * and of sufficient length. When explicit translations are absent but the
 * slides contain legacy English translation markers, this function returns
 * a single-element array containing the legacy language marker so the
 * rest of the normalization pipeline can treat the song as having English
 * translations.
 *
 * @param song - Raw song record (may include `translations`)
 * @param rawSlides - Raw slides map used to detect legacy translations
 * @param lyrics - The lyrics language code (to ignore legacy marker when identical)
 * @param script - Optional script language code (also checked against legacy marker)
 * @returns Readonly array of language codes to use as `translations` for normalization
 */
export default function getNormalizedTranslations({
    song,
    rawSlides,
    lyrics,
    script,
}: Readonly<{
    song: Record<string, unknown>;
    rawSlides: Record<string, unknown>;
    lyrics: string;
    script?: string | undefined;
}>): readonly string[] {
    const rawTranslations = Array.isArray(song["translations"]) 
        ? song["translations"].filter((value): value is string => typeof value === "string")
        : [];
    if (rawTranslations.length > MIN_STRING_LENGTH) {
        return rawTranslations;
    }
    if (
        hasLegacyEnglishTranslation(rawSlides) &&
        lyrics !== LEGACY_TRANSLATION_LANGUAGE &&
        script !== LEGACY_TRANSLATION_LANGUAGE
    ) {
        return [LEGACY_TRANSLATION_LANGUAGE];
    }
    return [];
}
