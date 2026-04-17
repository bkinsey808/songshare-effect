type DeriveSongFieldKeysParams = Readonly<{
	lyrics: string;
	script?: string | undefined;
	translations: readonly string[];
}>;

/**
 * Derive the ordered slide field keys for a song from its language columns.
 *
 * Returns `[lyrics, script?, ...translations]` while preserving the translation
 * order chosen for the song.
 *
 * @param lyrics - Required BCP 47 language code for the lyrics field.
 * @param script - Optional BCP 47 language code for the script field.
 * @param translations - Ordered translation language codes for slide text fields.
 * @returns Ordered slide field keys for the song.
 */
export default function deriveSongFieldKeys({
	lyrics,
	script,
	translations,
}: DeriveSongFieldKeysParams): readonly string[] {
	return [lyrics, ...(script === undefined ? [] : [script]), ...translations];
}
