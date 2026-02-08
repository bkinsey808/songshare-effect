import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Extracts a string field from an unknown record value safely.
 *
 * @param record - Record to extract from
 * @param fieldName - Name of the field to extract
 * @returns The field value if it's a string, otherwise undefined
 */
export default function extractStringField(record: unknown, fieldName: string): string | undefined {
	if (!isRecord(record)) {
		return undefined;
	}
	const value = record[fieldName];
	return isString(value) ? value : undefined;
}
