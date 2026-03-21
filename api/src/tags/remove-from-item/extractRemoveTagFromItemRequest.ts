import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { tagRemoveFromItemSchema } from "@/shared/validation/tagSchemas";

export type TagItemType = "song" | "playlist" | "event" | "community" | "image";

export type RemoveTagFromItemRequest = {
	tag_slug: string;
	item_type: TagItemType;
	item_id: string;
};

/**
 * Extract and validate the remove-tag-from-item request using the shared schema.
 *
 * @param request - Raw parsed JSON body.
 * @returns Validated `RemoveTagFromItemRequest`.
 * @throws Schema `ParseError` when required fields are missing or invalid.
 */
export default function extractRemoveTagFromItemRequest(
	request: unknown,
): RemoveTagFromItemRequest {
	return decodeUnknownSyncOrThrow(tagRemoveFromItemSchema, request);
}
