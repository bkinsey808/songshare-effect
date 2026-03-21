import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";

/**
 * Convert an `ImageTagRow` into an `ImageLibraryEntry` for the UI.
 *
 * When `image_public` is null, the result omits `image_public` and uses
 * empty strings for `user_id` and `created_at` so callers can read them safely.
 *
 * @param row - row returned from the tag-library image query
 * @returns user_id - owner id or empty string when unknown
 * @returns image_id - id from the tag row
 * @returns image_owner_id - owner id copied from `image_public` when present
 * @returns created_at - creation timestamp or empty string when unknown
 * @returns image_public - original `image_public` payload, included only when present
 */
export default function toImageLibraryEntry(row: ImageTagRow): ImageLibraryEntry {
	const ip = row.image_public ?? undefined;
	const ownerId = ip?.user_id ?? "";
	const createdAt = ip?.created_at ?? "";
	const entry: ImageLibraryEntry = {
		user_id: ownerId,
		image_id: row.image_id,
		image_owner_id: ownerId,
		created_at: createdAt,
	};
	if (ip !== undefined) {
		entry.image_public = ip;
	}
	return entry;
}
