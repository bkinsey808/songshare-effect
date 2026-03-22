import type { AddSongRequest } from "./AddSongRequest.type";

/**
 * Extract and validate the request payload for adding a song to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `song_id` string.
 * @returns - A validated AddSongRequest containing `song_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `song_id` is missing or not a string.
 */
export default function extractAddSongRequest(request: unknown): AddSongRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("song_id" in request)) {
		throw new TypeError("Request must contain song_id");
	}

	const { song_id } = request as Record<string, unknown>;

	if (typeof song_id !== "string") {
		throw new TypeError("song_id must be a string");
	}

	return { song_id };
}
