// Top-level helper: recursively convert SQL-null `null` values to `undefined`.
export function normalizeNullsTopLevel(input: unknown): unknown {
	const normalize = (value: unknown): unknown => {
		if (value === null) {
			return undefined;
		}
		if (Array.isArray(value)) {
			return value.map((item) => normalize(item));
		}
		if (typeof value === "object") {
			const obj = value as Record<string, unknown>;
			const entries = Object.entries(obj).map(
				([key, val]) => [key, normalize(val)] as const,
			);
			return Object.fromEntries(entries) as Record<string, unknown>;
		}
		return value;
	};
	return normalize(input);
}
