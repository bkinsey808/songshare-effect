// Top-level helper: recursively convert SQL-null `null` values to `undefined`.
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
