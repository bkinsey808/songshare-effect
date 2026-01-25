import { isRecord, isString } from "@/shared/utils/typeGuards";
import { type ValidationError } from "@/shared/validation/validate-types";

/**
 * Type guard to check if a value is an array of ValidationError objects.
 * 
 * @param value - The value to check
 * @returns true if value is an array of ValidationError objects
 */
export default function isValidationErrorArray(value: unknown): value is ValidationError[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((item) => {
		if (!isRecord(item)) {
			return false;
		}
		const { field, message } = item;
		return isString(field) && isString(message);
	});
}
