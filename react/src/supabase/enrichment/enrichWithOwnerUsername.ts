import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

import { isString } from "@/shared/utils/typeGuards";

import fetchUsername from "./fetchUsername";

/**
 * Enriches a record with owner username by fetching from user_public table.
 * Returns the original record if username cannot be fetched.
 *
 * @param client - Supabase client instance
 * @param record - Record to enrich (must have a user ID field)
 * @param userIdField - Name of the field containing the user ID (defaults to "song_owner_id")
 * @returns Record with optional owner_username field added
 */
export default async function enrichWithOwnerUsername<TRecord extends Record<string, unknown>>(
	client: SupabaseClientLike<Database>,
	record: TRecord,
	userIdField = "song_owner_id",
): Promise<TRecord & { owner_username?: string }> {
	const userId = record[userIdField];
	if (!isString(userId)) {
		return record;
	}

	const username = await fetchUsername({ client, userId });

	if (username === undefined) {
		return record;
	}

	return {
		...record,
		owner_username: username,
	};
}
