import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import { apiTagSearchPath } from "@/shared/paths";

/**
 * Searches the current user's tag library for slugs matching the query.
 * Used for autocomplete in the TagInput component.
 *
 * @param query - Search string (matched with ILIKE %query%)
 * @returns Array of matching tag slugs, or empty array on error
 */
export default async function searchTagsRequest(query: string): Promise<string[]> {
	try {
		const url = `${apiTagSearchPath}?q=${encodeURIComponent(query)}`;
		const response = await fetch(url, { credentials: "include" });
		if (!response.ok) {
			return [];
		}
		const raw: unknown = await response.json();
		if (!isRecord(raw) || !Array.isArray(raw["tags"])) {
			return [];
		}
		return (raw["tags"] as unknown[]).filter((item): item is string => isString(item));
	} catch (error: unknown) {
		console.error("[searchTagsRequest]", extractErrorMessage(error, "Failed to search tags"));
		return [];
	}
}
