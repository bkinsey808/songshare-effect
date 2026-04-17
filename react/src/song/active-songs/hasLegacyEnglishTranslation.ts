import isRecord from "@/shared/type-guards/isRecord";

/**
 * Detects if any slide in the raw slides map contains the legacy
 * `enTranslation` field with a non-empty string value.
 *
 * This helper is used to infer a legacy English translation flag when
 * older song imports stored an explicit `enTranslation` field on slides.
 *
 * @param rawSlides - Raw slide objects keyed by slide id (commonly from Supabase)
 * @returns `true` when at least one slide has a non-empty `enTranslation`, otherwise `false`
 */
export default function hasLegacyEnglishTranslation(rawSlides: Record<string, unknown>): boolean {
    return Object.values(rawSlides).some((slide) => {
        if (!isRecord(slide)) {
            return false;
        }
        const fieldData = slide["field_data"];
        return (
            isRecord(fieldData) &&
            typeof fieldData["enTranslation"] === "string" &&
            fieldData["enTranslation"].trim() !== ""
        );
    });
}
