/**
 * Safely parse JSON and return `unknown` or `undefined` if parsing fails.
 */
export const safeJsonParse = (input: unknown): unknown => {
	try {
		// Prefer parsing strings directly, but coerce other values to string as a fallback
		if (typeof input === "string") {
			return JSON.parse(input) as unknown;
		}
		return JSON.parse(String(input)) as unknown;
	} catch {
		return undefined;
	}
};
