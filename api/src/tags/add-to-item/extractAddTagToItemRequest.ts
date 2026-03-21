import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { tagAddToItemSchema } from "@/shared/validation/tagSchemas";

export type TagItemType = "song" | "playlist" | "event" | "community" | "image";

export type AddTagToItemRequest = {
	tag_slug: string;
	item_type: TagItemType;
	item_id: string;
};

/**
 * Extract and validate the add-tag-to-item request using the shared schema.
 *
 * @param request - Raw parsed JSON body.
 * @returns Validated `AddTagToItemRequest`.
 * @throws Schema `ParseError` when required fields are missing or invalid.
 */
export default function extractAddTagToItemRequest(request: unknown): AddTagToItemRequest {
	return decodeUnknownSyncOrThrow(tagAddToItemSchema, request);
}
