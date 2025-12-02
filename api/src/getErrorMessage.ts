export default function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}

	try {
		// Prefer JSON serialization for objects to get a useful representation
		const json = JSON.stringify(error);
		if (typeof json === "string" && json !== undefined) {
			return json;
		}
	} catch {
		// fall through to a generic fallback
	}

	// Explicitly use Object.prototype.toString to avoid using an object's
	// default stringifier which ESLint flags as `no-base-to-string`.
	try {
		return Object.prototype.toString.call(error);
	} catch {
		return "[unknown]";
	}
}
