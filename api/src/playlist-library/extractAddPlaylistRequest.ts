import type { AddPlaylistRequest } from "./AddPlaylistRequest.type";

/**
 * Extract and validate the request payload for adding a playlist to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `playlist_id` string.
 * @returns - A validated `AddPlaylistRequest` containing `playlist_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `playlist_id` is missing or not a string.
 */
export default function extractAddPlaylistRequest(request: unknown): AddPlaylistRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("playlist_id" in request)) {
		throw new TypeError("Request must contain playlist_id");
	}

	const { playlist_id } = request as Record<string, unknown>;

	if (typeof playlist_id !== "string") {
		throw new TypeError("playlist_id must be a string");
	}

	return { playlist_id };
}
