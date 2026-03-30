/**
 * Map a cleaned Supabase field type and field name to the simplified mapped type
 * used by the schema generator.
 *
 * @param cleanType - Simplified TypeScript field type extracted from generated types.
 * @param fieldNameLocal - Database column name associated with the field type.
 * @returns Simplified schema-generator type label for the field.
 */
function mapToMappedType(cleanType: string, fieldNameLocal: string): string {
	if (cleanType.endsWith("[]")) {
		return cleanType;
	}
	if (cleanType.includes("number")) {
		return "number";
	}
	if (cleanType.includes("boolean")) {
		return "boolean";
	}
	if (cleanType.includes("Date")) {
		return "Date";
	}
	if (cleanType.includes("Json")) {
		return "Json";
	}
	if (isUuidLikeIdentifierField(fieldNameLocal) && cleanType === "string") {
		return "uuid";
	}
	return "string";
}

/**
 * Detects identifier-shaped field names that should map to UUID semantics.
 *
 * @param fieldName - Database column name to inspect.
 * @returns Whether the field name should be treated as a UUID identifier.
 */
function isUuidLikeIdentifierField(fieldName: string): boolean {
	return fieldName === "id" || fieldName.endsWith("_id");
}

export default mapToMappedType;
