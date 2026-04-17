import deriveSongFieldKeys from "@/shared/song/deriveSongFieldKeys";

/**
 * Build an object with every song field key mapped to an empty string.
 *
 * The returned shape is suitable for initializing slide `field_data` when
 * creating a blank slide or when a song has no existing data for a field.
 *
 * @param lyrics - Lyrics language code
 * @param script - Optional script language code
 * @param translations - Translation language codes to include as fields
 * @returns Map of field key to empty string
 */
export default function makeEmptyFieldData({
    lyrics,
    script,
    translations,
}: Readonly<{
    lyrics: readonly string[];
    script?: readonly string[] | undefined;
    translations: readonly string[];
}>): Record<string, string> {
    return Object.fromEntries(
        deriveSongFieldKeys({
            lyrics,
            script,
            translations,
        }).map((fieldKey) => [fieldKey, ""]),
    );
}
