import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";

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
