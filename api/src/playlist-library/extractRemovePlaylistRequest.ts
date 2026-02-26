import type { RemovePlaylistRequest } from "./RemovePlaylistRequest.type";

/**
 * Extract and validate the request payload for removing a playlist from a
 * user's library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing the `playlist_id` string.
 * @returns - A validated `RemovePlaylistRequest` with a `playlist_id`.
 * @throws - `TypeError` when the request is not an object or missing/invalid
 *   `playlist_id`.
 */
export default function extractRemovePlaylistRequest(request: unknown): RemovePlaylistRequest {
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
