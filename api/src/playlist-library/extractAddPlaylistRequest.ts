import type { AddPlaylistRequest } from "./AddPlaylistRequest.type";

/**
 * Extract and validate the request payload for adding a playlist to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `playlist_id` and `playlist_owner_id` strings.
 * @returns - A validated `AddPlaylistRequest` containing `playlist_id` and
 *   `playlist_owner_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `playlist_id`/`playlist_owner_id` are missing or not strings.
 */
export default function extractAddPlaylistRequest(request: unknown): AddPlaylistRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("playlist_id" in request) || !("playlist_owner_id" in request)) {
		throw new TypeError("Request must contain playlist_id and playlist_owner_id");
	}

	const { playlist_id, playlist_owner_id } = request as Record<string, unknown>;

	if (typeof playlist_id !== "string" || typeof playlist_owner_id !== "string") {
		throw new TypeError("playlist_id and playlist_owner_id must be strings");
	}

	return { playlist_id, playlist_owner_id };
}
