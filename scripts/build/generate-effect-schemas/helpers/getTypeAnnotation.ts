export function getTypeAnnotation(effectType: string): string {
	if (effectType.startsWith("Schema.Array(")) {
		const inner = effectType.slice("Schema.Array(".length, -1);
		return `Schema.Array$<${getTypeAnnotation(inner)}>`;
	}

	if (effectType.startsWith("Schema.optional(")) {
		const innerType = effectType.slice(16, -1);
		return `Schema.optional<${getTypeAnnotation(innerType)}>`;
	}

	return `typeof ${effectType}`;
}
