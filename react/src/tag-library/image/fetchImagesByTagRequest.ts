import isImageLibraryEntry from "@/react/image-library/guards/isImageLibraryEntry";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";

export type FetchImagesByTagResult =
	| { ok: true; entries: ImageLibraryEntry[] }
	| { ok: false; error: string };

/**
 * Fetches the current user's library images tagged with the given slug.
 *
 * @param tagSlug - The tag slug to filter by
 * @returns Result with entries on success or an error message on failure
 */
export default async function fetchImagesByTagRequest(
	tagSlug: string,
): Promise<FetchImagesByTagResult> {
	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return { ok: true, entries: [] };
		}

		// Step 1: get image_ids tagged with this slug
		const tagResult = await callSelect(client, "image_tag", {
			cols: "image_id",
			eq: { col: "tag_slug", val: tagSlug },
		});
		if (!isRecord(tagResult) || tagResult.error !== null) {
			return { ok: false, error: "Failed to load images for this tag." };
		}
		const tagRows: unknown[] = Array.isArray(tagResult.data) ? tagResult.data : [];
		const imageIds = tagRows
			.filter(
				(tagRow): tagRow is { image_id: string } =>
					isRecord(tagRow) && typeof tagRow["image_id"] === "string",
			)
			.map((tagRow) => tagRow.image_id);

		if (imageIds.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 2: get the current user's library entries for those image_ids (RLS-filtered)
		const libraryResult = await callSelect(client, "image_library", {
			cols: "*, image_public(*)",
			in: { col: "image_id", vals: imageIds },
		});
		if (!isRecord(libraryResult) || libraryResult.error !== null) {
			return { ok: false, error: "Failed to load images for this tag." };
		}
		const rows: unknown[] = Array.isArray(libraryResult.data) ? libraryResult.data : [];
		const entries = rows.filter((row): row is ImageLibraryEntry => isImageLibraryEntry(row));
		return { ok: true, entries };
	} catch {
		return { ok: false, error: "Failed to load images for this tag." };
	}
}
