export type AddImageRequest = {
	image_id: string;
};

/**
 * Extract and validate the add-to-library request.
 *
 * @param request - Raw parsed JSON body.
 * @returns - Validated `AddImageRequest`.
 * @throws - `TypeError` when required fields are missing or invalid.
 */
export default function extractAddImageRequest(request: unknown): AddImageRequest {
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
