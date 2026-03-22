import isRecord from "@/shared/type-guards/isRecord";

import type { AddPlaylistToLibraryRequest } from "../slice/playlist-library-types";

/**
 * Validates that a value is a valid AddPlaylistToLibraryRequest (client sends only these fields).
 */
export default function guardAsAddPlaylistRequest(
	value: unknown,
	context: string,
): AddPlaylistToLibraryRequest {
	if (!isRecord(value)) {
		throw new TypeError(`${context}: expected object, got ${typeof value}`);
	}
	if (typeof value["playlist_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid playlist_id`);
	}
	return {
		playlist_id: value["playlist_id"],
	};
}
