/**
 * Convert an arbitrary value into an `Error` instance, preserving cause if available.
 *
 * @param value - value to convert
 * @param cause - optional cause to attach
 * @returns Error instance representing the value
 */
export default function toError(value: unknown, cause?: unknown): Error & { cause?: unknown } {
	if (value instanceof Error) {
		return value;
	}
	try {
		const msg = typeof value === "string" ? value : JSON.stringify(value);
		return new Error(msg, { cause });
	} catch {
		return new Error(String(value), { cause });
	}
}
