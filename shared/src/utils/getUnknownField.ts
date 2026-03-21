/**
 * Safely read a field from an unknown value as unknown.
 *
 * This helper avoids repeated unsafe assertions across call sites. It accepts an
 * unknown `obj` and returns the value of `key` when present, otherwise
 * `undefined`.
 *
 * Note: `Reflect.get` returns `any`; we centralize a single narrow eslint
 * exception here and return the value as `unknown` for safe handling.
 *
 * @param obj - object to read from
 * @param key - property key to read
 * @returns property value as unknown
 */
export default function getUnknownField(obj: unknown, key: string): unknown {
	if (typeof obj !== "object" || obj === null) {
		return undefined;
	}

	// Reflect.get returns `any` in lib typings. Keep the single localized eslint
	// exception here rather than repeating unsafe assertions at call sites.
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- reflect returns any; we return unknown */
	const val = Reflect.get(obj, key);
	return val;
}
