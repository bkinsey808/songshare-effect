/* oxlint-disable @typescript-eslint/no-magic-numbers */

type DeriveSongFieldKeysParams = Readonly<{
	lyrics: readonly string[];
	script?: readonly string[] | undefined;
	translations: readonly string[];
}>;

/**
 * Derive the ordered slide field keys for a song from its language columns.
 *
 * Returns `["lyrics", "script"?, ...translations]` while preserving the translation
 * order chosen for the song. The keys "lyrics" and "script" are used as static keys 
 * in the slide's field_data when those fields are non-empty.
 *
 * @param lyrics - BCP 47 language codes for the lyrics field.
 * @param script - Optional BCP 47 language codes for the script field.
 * @param translations - Ordered translation language codes for slide text fields.
 * @returns Ordered slide field keys for the song.
 */
export default function deriveSongFieldKeys({
	lyrics,
	script,
	translations,
}: DeriveSongFieldKeysParams): readonly string[] {
	return [
		...(lyrics.length > 0 ? ["lyrics"] : []),
		...((script !== undefined && script.length > 0) ? ["script"] : []),
		...translations,
	];
}
