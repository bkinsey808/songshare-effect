/**
 * Ensure all required field keys exist on a slide's `field_data` object.
 * Missing keys are added with an empty string value.
 *
 * @param existingData - Current field data map for a slide.
 * @param requiredFields - Array of field names that must be present on every slide.
 * @returns - A new record containing all original entries plus any missing
 *   required fields set to an empty string.
 */
export default function ensureAllFieldsPresent(
	existingData: Record<string, string>,
	requiredFields: readonly string[],
): Record<string, string> {
	const result = { ...existingData };
	for (const field of requiredFields) {
		if (!(field in result)) {
			result[field] = "";
		}
	}
	return result;
}
