/**
 * Converts a schema expression string into the corresponding schema type annotation.
 *
 * @param effectType - Effect schema expression string.
 * @returns Schema type annotation string for generated source output.
 */
export default function getTypeAnnotation(effectType: string): string {
	const END_INDEX_OFFSET = 1; // skip trailing closing parenthesis
	const ARRAY_PREFIX_LENGTH = "Schema.Array(".length;
	const OPTIONAL_PREFIX_LENGTH = "Schema.optional(".length;
	if (effectType.startsWith("Schema.Array(")) {
		const inner = effectType.slice(ARRAY_PREFIX_LENGTH, effectType.length - END_INDEX_OFFSET);
		return `Schema.Array$<${getTypeAnnotation(inner)}>`;
	}

	if (effectType.startsWith("Schema.optional(")) {
		const innerType = effectType.slice(
			OPTIONAL_PREFIX_LENGTH,
			effectType.length - END_INDEX_OFFSET,
		);
		return `Schema.optional<${getTypeAnnotation(innerType)}>`;
	}

	return `typeof ${effectType}`;
}
