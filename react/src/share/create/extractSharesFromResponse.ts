import isSharedItem from "@/react/share/guards/isSharedItem";
import type { SharedItem } from "@/react/share/slice/share-types";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Extracts and validates SharedItem array from share list API response.
 * Supports both flat `{ shares }` and wrapped `{ success, data: { shares } }` shapes.
 * Invalid or non-matching items are filtered out; returns empty array on malformed input.
 *
 * @param value - Raw JSON response from the share list API
 * @returns Valid SharedItem array, or empty array if structure is invalid
 */
export default function extractSharesFromResponse(value: unknown): SharedItem[] {
	if (!isRecord(value)) {
		return [];
	}
	const rawShares = value["shares"];
	if (Array.isArray(rawShares)) {
		return rawShares.filter((item): item is SharedItem => isSharedItem(item));
	}
	const { data } = value;
	if (isRecord(data)) {
		const nestedShares = data["shares"];
		return Array.isArray(nestedShares)
			? nestedShares.filter((item): item is SharedItem => isSharedItem(item))
			: [];
	}
	return [];
}
