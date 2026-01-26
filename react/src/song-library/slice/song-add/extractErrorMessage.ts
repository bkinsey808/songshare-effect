import isRecord from "@/shared/type-guards/isRecord";

/**
 * Extract error message from JSON response
 * @param data - Data from response.json()
 * @returns Error message string or undefined
 */
export default function extractErrorMessage(data: unknown): string | undefined {
	if (!isRecord(data)) {
		return undefined;
	}
	const { error } = data;
	if (typeof error === "string") {
		return error;
	}
	return undefined;
}
