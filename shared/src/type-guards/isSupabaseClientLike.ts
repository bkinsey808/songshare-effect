import isRecord from "./isRecord";

/**
 * Minimal runtime guard for a Supabase-like client used by the app.
 *
 * The guard is intentionally narrow: it asserts the presence of a
 * `from` method (the surface used by our query helpers). Keeping it
 * minimal avoids brittleness while allowing safer runtime checks.
 *
 * @param value - Value to check
 * @returns `true` if `value` has a `from` function, otherwise `false`
 */
export default function isSupabaseClientLike(value: unknown): value is {
	from: (table: string) => {
		select: (query: string) => {
			in: (
				column: string,
				values: readonly string[],
			) => Promise<{ data: unknown[]; error: unknown }>;
		};
	};
} {
	if (!isRecord(value)) {
		return false;
	}
	const rec = value;
	return typeof rec["from"] === "function";
}
