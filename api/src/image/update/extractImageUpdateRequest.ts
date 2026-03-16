export type ImageUpdateRequest = {
	image_id: string;
	image_name: string;
	description: string;
	alt_text: string;
};

/**
 * Extract and validate the update request from raw JSON.
 *
 * @param request - Raw parsed JSON body.
 * @returns - Validated `ImageUpdateRequest`.
 * @throws - `TypeError` when required fields are missing or invalid.
 */
export default function extractImageUpdateRequest(request: unknown): ImageUpdateRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}
	if (!("image_id" in request)) {
		throw new TypeError("image_id must be a non-empty string");
	}
	if (!("image_name" in request)) {
		throw new TypeError("image_name must be a string");
	}
	if (!("description" in request)) {
		throw new TypeError("description must be a string");
	}
	if (!("alt_text" in request)) {
		throw new TypeError("alt_text must be a string");
	}
	const { image_id, image_name, description, alt_text } = request as Record<string, unknown>;
	if (typeof image_id !== "string" || image_id.trim() === "") {
		throw new TypeError("image_id must be a non-empty string");
	}
	if (typeof image_name !== "string") {
		throw new TypeError("image_name must be a string");
	}
	if (typeof description !== "string") {
		throw new TypeError("description must be a string");
	}
	if (typeof alt_text !== "string") {
		throw new TypeError("alt_text must be a string");
	}
	return {
		image_id: image_id.trim(),
		image_name: image_name.trim(),
		description: description.trim(),
		alt_text: alt_text.trim(),
	};
}
