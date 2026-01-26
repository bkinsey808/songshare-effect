const ZERO = 0;

export default function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) {
		return true;
	}

	if (typeof value === "string") {
		return value.trim().length === ZERO;
	}

	if (Array.isArray(value)) {
		return value.length === ZERO;
	}

	if (value instanceof Map || value instanceof Set) {
		return value.size === ZERO;
	}

	if (typeof value === "object") {
		return Object.keys(value).length === ZERO;
	}

	return false;
}
