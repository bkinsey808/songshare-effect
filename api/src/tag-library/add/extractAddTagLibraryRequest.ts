import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { tagLibraryAddSchema } from "@/shared/validation/tagSchemas";

export type AddTagLibraryRequest = {
	tag_slug: string;
};

/**
 * Extract and validate the add-tag-to-library request using the shared schema.
 *
 * @param request - Raw parsed JSON body.
 * @returns Validated `AddTagLibraryRequest`.
 * @throws Schema `ParseError` when required fields are missing or invalid.
 */
export default function extractAddTagLibraryRequest(request: unknown): AddTagLibraryRequest {
	return decodeUnknownSyncOrThrow(tagLibraryAddSchema, request);
}
