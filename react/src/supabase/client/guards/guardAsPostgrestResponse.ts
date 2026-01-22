import { isRecord } from "@/shared/utils/typeGuards";

/**
 * Type predicate that checks if a value looks like a Postgrest response.
 * @param value - The value to check
 * @returns True if value has error or data properties
 */
export default function guardAsPostgrestResponse(
	value: unknown,
): value is { error?: unknown; data?: unknown } {
	if (!isRecord(value)) {
		return false;
	}

	return "error" in value || "data" in value;
}
