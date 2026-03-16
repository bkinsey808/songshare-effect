export type RemoveImageRequest = {
	image_id: string;
};

/**
 * Extract and validate the remove-from-library request.
 *
 * @param request - Raw parsed JSON body.
 * @returns - Validated `RemoveImageRequest`.
 * @throws - `TypeError` when required fields are missing or invalid.
 */
export default function extractRemoveImageRequest(request: unknown): RemoveImageRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}
	if (!("image_id" in request)) {
		throw new TypeError("Request must contain image_id");
	}
	const { image_id } = request as Record<string, unknown>;
	if (typeof image_id !== "string" || image_id.trim() === "") {
		throw new TypeError("image_id must be a non-empty string");
	}
	return { image_id: image_id.trim() };
}
