import type { EventLibraryEntry } from "@/react/event-library/event-library-types";
import isEventLibraryEntry from "@/react/event-library/guards/isEventLibraryEntry";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";

export type FetchEventsByTagResult =
	| { ok: true; entries: EventLibraryEntry[] }
	| { ok: false; error: string };

/**
 * Fetches the current user's library events tagged with the given slug.
 *
 * @param tagSlug - The tag slug to filter by
 * @returns Result with entries on success or an error message on failure
 */
export default async function fetchEventsByTagRequest(
	tagSlug: string,
): Promise<FetchEventsByTagResult> {
	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return { ok: true, entries: [] };
		}

		// Step 1: get event_ids tagged with this slug
		const tagResult = await callSelect(client, "event_tag", {
			cols: "event_id",
			eq: { col: "tag_slug", val: tagSlug },
		});
		if (!isRecord(tagResult) || tagResult.error !== null) {
			return { ok: false, error: "Failed to load events for this tag." };
		}
		const tagRows: unknown[] = Array.isArray(tagResult.data) ? tagResult.data : [];
		const eventIds = tagRows
			.filter(
				(tagRow): tagRow is { event_id: string } =>
					isRecord(tagRow) && typeof tagRow["event_id"] === "string",
			)
			.map((tagRow) => tagRow.event_id);

		if (eventIds.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 2: get the current user's library entries for those event_ids (RLS-filtered)
		const libraryResult = await callSelect(client, "event_library", {
			cols: "*, event_public!inner(*, owner:user_public!owner_id(username))",
			in: { col: "event_id", vals: eventIds },
		});
		if (!isRecord(libraryResult) || libraryResult.error !== null) {
			return { ok: false, error: "Failed to load events for this tag." };
		}
		const rows: unknown[] = Array.isArray(libraryResult.data) ? libraryResult.data : [];
		const entries = rows.filter((row): row is EventLibraryEntry => isEventLibraryEntry(row));
		return { ok: true, entries };
	} catch {
		return { ok: false, error: "Failed to load events for this tag." };
	}
}
