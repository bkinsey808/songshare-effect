import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Type predicate that checks if a value looks like a Postgrest error object.
 * @param value - The value to check
 * @returns True if value has message property that is a string
 */
export default function guardAsFetchError(value: unknown): value is { message: string } {
	if (!isRecord(value)) {
		return false;
	}

	return isString(value["message"]);
}
