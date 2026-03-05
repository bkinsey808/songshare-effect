import type { SharedItem } from "../slice/share-types";

/**
 * Type guard to check if an unknown value is a valid SharedItem.
 *
 * @param value - The value to check
 * @returns true if the value is a SharedItem, false otherwise
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function isSharedItem(value: unknown): value is SharedItem {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value['share_id'] === "string" &&
		typeof value['sender_user_id'] === "string" &&
		typeof value['recipient_user_id'] === "string" &&
		typeof value['shared_item_type'] === "string" &&
		typeof value['shared_item_id'] === "string" &&
		typeof value['shared_item_name'] === "string" &&
		typeof value['status'] === "string" &&
		(value['message'] === null || value['message'] === undefined || typeof value['message'] === "string") &&
		(value['created_at'] === undefined || typeof value['created_at'] === "string") &&
		(value['updated_at'] === undefined || typeof value['updated_at'] === "string")
	);
}