import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { tagLibraryRemoveSchema } from "@/shared/validation/tagSchemas";

export type RemoveTagLibraryRequest = {
	tag_slug: string;
};

/**
 * Extract and validate the remove-tag-from-library request using the shared schema.
 *
 * @param request - Raw parsed JSON body.
 * @returns Validated `RemoveTagLibraryRequest`.
 * @throws Schema `ParseError` when required fields are missing or invalid.
 */
export default function extractRemoveTagLibraryRequest(
	request: unknown,
): RemoveTagLibraryRequest {
	return decodeUnknownSyncOrThrow(tagLibraryRemoveSchema, request);
}
