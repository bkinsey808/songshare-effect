import isRecord from "@/shared/type-guards/isRecord";

/**
 * Extracts the `stack` string from an Error-like payload or returns the provided fallback.
 *
 * - If `payload` is an `Error` and has a `stack` string, return it.
 * - If `payload` is a record and has a string `stack` field, return it.
 * - Otherwise return `fallback`.
 */
export default function extractErrorStack(payload: unknown, fallback = "No stack trace"): string {
	if (payload instanceof Error && typeof payload.stack === "string") {
		return payload.stack;
	}

	if (isRecord(payload) && typeof payload["stack"] === "string") {
		return payload["stack"];
	}

	return fallback;
}
