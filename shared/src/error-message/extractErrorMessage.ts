import isRecord from "@/shared/type-guards/isRecord";

/**
 * Extracts an error message from a parsed JSON response, if present.
 *
 * Checks common properties (`error`, `message`) and returns the first
 * string value found. Returns `undefined` when no string message is present.
 *
 * @param payload - The parsed JSON response (unknown)
 * @returns The extracted error message, or `undefined` if none found
 */

/**
 * Extracts an error message from a parsed payload with optional fallback.
 *
 * @param payload - The parsed JSON response (unknown)
 * @param fallback - Fallback string when no message is present
 * @returns Extracted message or the provided fallback
 */

/**
 * Extract an error message from a payload or return `undefined` when none present.
 *
 * @returns The extracted message or `undefined`
 */
export default function extractErrorMessage(payload: unknown): string | undefined;

/**
 * Extract an error message from a payload or return the provided `fallback`.
 *
 * @returns The extracted message or the provided fallback
 */
export default function extractErrorMessage(payload: unknown, fallback: string): string;

/**
 * Extracts an error message from a parsed payload with optional fallback.
 *
 * @param payload - The parsed JSON response (unknown)
 * @param fallback - Optional fallback string when no message is present
 * @returns The extracted message, the fallback, or `undefined` when none available
 */
export default function extractErrorMessage(
	payload: unknown,
	fallback?: string,
): string | undefined {
	// Handle null/undefined explicitly (do not stringify them)
	if (payload === undefined || payload === null) {
		return fallback;
	}

	// Handle Error instances and strings
	if (payload instanceof Error && typeof payload.message === "string") {
		return payload.message;
	}

	if (typeof payload === "string") {
		return payload;
	}

	// If it's a record-like value (parsed JSON) check common fields
	if (isRecord(payload)) {
		const maybe = payload["error"] ?? payload["message"];
		if (typeof maybe === "string") {
			return maybe;
		}

		// If the payload has an error/message field but it's not a string, prefer
		// JSON-serializing the payload so callers can inspect nested details.
		if (maybe !== undefined) {
			try {
				return JSON.stringify(payload);
			} catch {
				// Ignore serialization errors and fall through to fallback below
			}
		}

		// No error/message fields present. If a fallback was provided, prefer
		// that over returning a JSON-serialized object (e.g., `{}` should map
		// to the provided fallback).
		if (typeof fallback === "string") {
			return fallback;
		}

		// As a last resort, return the JSON serialization of the payload.
		try {
			return JSON.stringify(payload);
		} catch {
			// ignore
		}
	}

	// Only stringify known primitives; avoid default object stringification
	if (
		typeof payload === "number" ||
		typeof payload === "boolean" ||
		typeof payload === "bigint" ||
		typeof payload === "symbol"
	) {
		return String(payload);
	}

	// Handle Error instances and strings (already handled above) and nullish
	// values have been handled at the top of the function.

	return fallback;
}
