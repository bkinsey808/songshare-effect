import isRecord from "@/shared/type-guards/isRecord";

import type { PlaylistLibraryEntry } from "../slice/playlist-library-types";

/**
 * Validates that a value is a valid PlaylistLibraryEntry (server response shape).
 *
 * @param value - The value to check.
 * @param context - Context for error messages.
 * @returns The validated entry.
 */
export default function guardAsPlaylistLibraryEntry(
	value: unknown,
	context: string,
): PlaylistLibraryEntry {
	if (!isRecord(value)) {
		throw new TypeError(`${context}: expected object, got ${typeof value}`);
	}
	if (typeof value["playlist_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid playlist_id`);
	}
	if (typeof value["user_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid user_id`);
	}
	if (typeof value["created_at"] !== "string") {
		throw new TypeError(`${context}: missing or invalid created_at`);
	}

	const entry: PlaylistLibraryEntry = {
		playlist_id: value["playlist_id"],
		user_id: value["user_id"],
		created_at: value["created_at"],
		...(typeof value["playlist_owner_id"] === "string"
			? { playlist_owner_id: value["playlist_owner_id"] }
			: {}),
		...(typeof value["owner_username"] === "string"
			? { owner_username: value["owner_username"] }
			: {}),
		...(isRecord(value["playlist_public"])
			? {
					playlist_public: {
						playlist_name: String(value["playlist_public"]["playlist_name"]),
						playlist_slug: String(value["playlist_public"]["playlist_slug"]),
					},
				}
			: {}),
		...(typeof value["playlist_name"] === "string"
			? { playlist_name: value["playlist_name"] }
			: {}),
		...(typeof value["playlist_slug"] === "string"
			? { playlist_slug: value["playlist_slug"] }
			: {}),
	};

	return entry;
}
