import type { AddSongRequest } from "./AddSongRequest.type";

/**
 * Extract and validate the request payload for adding a song to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `song_id` and `song_owner_id` strings.
 * @returns - A validated AddSongRequest containing `song_id` and
 *   `song_owner_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `song_id`/`song_owner_id` are missing or not strings.
 */
export default function extractAddSongRequest(request: unknown): AddSongRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("song_id" in request) || !("song_owner_id" in request)) {
		throw new TypeError("Request must contain song_id and song_owner_id");
	}

	const { song_id, song_owner_id } = request as Record<string, unknown>;

	if (typeof song_id !== "string" || typeof song_owner_id !== "string") {
		throw new TypeError("song_id and song_owner_id must be strings");
	}

	return { song_id, song_owner_id };
}
