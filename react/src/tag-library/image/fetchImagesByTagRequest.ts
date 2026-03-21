import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";
import isImageTagRow from "@/react/tag-library/image/isImageTagRow";
import toImageLibraryEntry from "@/react/tag-library/image/toImageLibraryEntry";
import isRecord from "@/shared/type-guards/isRecord";

export type FetchImagesByTagResult =
	| { ok: true; entries: ImageLibraryEntry[] }
	| { ok: false; error: string };

/**
 * Fetches all images tagged with the given slug from Supabase.
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
		const result = await callSelect<ImageTagRow>(client, "image_tag", {
			cols: "image_id, image_public(*)",
			eq: { col: "tag_slug", val: tagSlug },
		});
		if (!isRecord(result) || result.error !== null) {
			return { ok: false, error: "Failed to load images for this tag." };
		}
		const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
		const entries = rows
			.filter((row): row is ImageTagRow => isImageTagRow(row))
			.map((row) => toImageLibraryEntry(row));
		return { ok: true, entries };
	} catch {
		return { ok: false, error: "Failed to load images for this tag." };
	}
}
