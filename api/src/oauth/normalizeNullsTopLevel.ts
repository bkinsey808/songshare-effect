/**
 * Recursively normalize SQL `null` values to `undefined` at the top level.
 *
 * - Converts `null` to `undefined`.
 * - Recurses into arrays and plain object records to normalize nested values.
 * - Leaves non-object, non-array values unchanged.
 *
 * This is useful when database rows use `null` to represent missing values
 * but consumers prefer `undefined` for absent properties.
 *
 * @param input - Arbitrary JSON-like value returned from the database.
 * @returns - The same structure with all `null` values replaced by `undefined`.
 */
import isRecord from "@/shared/type-guards/isRecord";

export default function normalizeNullsTopLevel(input: unknown): unknown {
	function normalize(value: unknown): unknown {
		if (value === null) {
			return undefined;
		}
		if (Array.isArray(value)) {
			return value.map((item) => normalize(item));
		}
		if (isRecord(value)) {
			const entries = Object.entries(value).map(([key, val]) => [key, normalize(val)] as const);
			return Object.fromEntries(entries);
		}
		return value;
	}
	return normalize(input);
}
