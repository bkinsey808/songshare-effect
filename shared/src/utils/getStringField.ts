/**
 * Safely read a string field from an unknown value.
 *
 * This helper avoids repeated unsafe assertions across call sites. It accepts an
 * unknown `obj` and returns the string value of `key` when present, otherwise
 * `undefined`.
 *
 * Note: `Reflect.get` returns `any`; we centralize a single narrow eslint
 * exception here and validate the runtime type before returning.
 */
export default function getStringField(obj: unknown, key: string): string | undefined {
	if (typeof obj !== "object" || obj === null) {
		return undefined;
	}

	// Reflect.get returns `any` in lib typings. Keep the single localized eslint
	// exception here rather than repeating unsafe assertions at call sites.
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- reflect returns any; we validate before returning */
	const val = Reflect.get(obj, key);
	return typeof val === "string" ? val : undefined;
}
