import isRecordStringUnknown from "@/shared/utils/isRecordStringUnknown";

// Narrow once at this small trusted boundary. This avoids unsafe casts at
// every call site while keeping the runtime check in one place.

/**
 * Small helpers for safely reading environment-like bindings (e.g. `ctx.env`).
 * These avoid casting `ctx.env as unknown as Record<string, ...>` at call sites.
 *
 * @param envLike - Environment-like object (for example `ctx.env`)
 * @param key - The environment key to read
 * @returns The string value when present, otherwise `undefined`
 */
export function getEnvString(envLike: unknown, key: string): string | undefined {
	if (envLike === undefined || envLike === null) {
		return undefined;
	}
	if (typeof envLike !== "object") {
		return undefined;
	}

	if (!isRecordStringUnknown(envLike)) {
		return undefined;
	}
	// `envLike` is narrowed by the guard above so we can treat it as a record.
	const rec = envLike;
	const val: unknown = rec[key];
	return typeof val === "string" ? val : undefined;
}

/**
 * Read an environment key with a provided default value.
 *
 * @param envLike - Environment-like object
 * @param key - The environment key to read
 * @param def - Default value to return when key is not present
 * @returns The environment value or the provided default
 */
export function getEnvStringOrDefault(envLike: unknown, key: string, def: string): string {
	const val = getEnvString(envLike, key);
	return val === undefined ? def : val;
}
