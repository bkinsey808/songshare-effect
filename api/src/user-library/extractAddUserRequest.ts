import type { AddUserRequest } from "./AddUserRequest.type";

/**
 * Extract and validate the request payload for adding a user to the library.
 *
 * Ensures the incoming `request` is an object and contains a `followed_user_id`
 * property of type string. Returns a sanitized `AddUserRequest` on success.
 *
 * @param request - The raw request payload (typically parsed JSON).
 * @returns - A validated `AddUserRequest` containing `followed_user_id`.
 * @throws - `TypeError` when the request is not an object, is missing required
 *   properties, or when `followed_user_id` is not a string.
 */
export default function extractAddUserRequest(request: unknown): AddUserRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("followed_user_id" in request)) {
		throw new TypeError("Request must contain followed_user_id");
	}

	const { followed_user_id } = request as Record<string, unknown>;

	if (typeof followed_user_id !== "string") {
		throw new TypeError("followed_user_id must be a string");
	}

	return { followed_user_id };
}
