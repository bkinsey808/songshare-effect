type ImageUpdateRequest = {
	image_id: string;
	image_name: string;
	description: string;
	alt_text: string;
	focal_point_x: number;
	focal_point_y: number;
	tags: string[] | undefined;
};

const MIN_FOCAL_POINT = 0;
const MAX_FOCAL_POINT = 100;

/**
 * Parse and validate a focal point numeric value from untyped input.
 *
 * @param value - Value to validate as a number between 0 and 100
 * @param fieldName - Field name used in error messages
 * @returns parsed numeric focal point
 * @throws TypeError when the value is missing or out of range
 */
function parseFocalPoint(value: unknown, fieldName: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new TypeError(`${fieldName} must be a number between 0 and 100`);
	}
	if (value < MIN_FOCAL_POINT || value > MAX_FOCAL_POINT) {
		throw new TypeError(`${fieldName} must be a number between 0 and 100`);
	}
	return value;
}

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
	if (!("focal_point_x" in request)) {
		throw new TypeError("focal_point_x must be a number between 0 and 100");
	}
	if (!("focal_point_y" in request)) {
		throw new TypeError("focal_point_y must be a number between 0 and 100");
	}
	const { image_id, image_name, description, alt_text, focal_point_x, focal_point_y, tags } =
		request as Record<string, unknown>;
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
	const parsedFocalPointX = parseFocalPoint(focal_point_x, "focal_point_x");
	const parsedFocalPointY = parseFocalPoint(focal_point_y, "focal_point_y");
	const parsedTags: string[] | undefined = Array.isArray(tags)
		? tags.filter((t): t is string => typeof t === "string")
		: undefined;
	return {
		image_id: image_id.trim(),
		image_name: image_name.trim(),
		description: description.trim(),
		alt_text: alt_text.trim(),
		focal_point_x: parsedFocalPointX,
		focal_point_y: parsedFocalPointY,
		tags: parsedTags,
	};
}

export type { ImageUpdateRequest };
