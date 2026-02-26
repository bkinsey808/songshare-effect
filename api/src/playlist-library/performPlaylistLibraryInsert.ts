import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError } from "../api-errors";

/**
 * Row type used when inserting into `playlist_library`.
 * Exported for tests that need to construct mock results.
 */
export type PlaylistLibraryRow = Database["public"]["Tables"]["playlist_library"]["Row"];

/**
 * Perform the Supabase insert for playlist_library.
 *
 * This helper is primarily consumed by the real handler; separating it keeps
 * the handler lean and allows non-handler callers (including unit tests) to
 * work with the returned Effect directly.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing playlist_id and playlist_owner_id
 * @returns Insert result or error
 */
export default function performPlaylistLibraryInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: { playlist_id: string; playlist_owner_id: string },
): Effect.Effect<PostgrestSingleResponse<PlaylistLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("playlist_library")
				.insert([
					{
						user_id: userId,
						playlist_id: req.playlist_id,
						playlist_owner_id: req.playlist_owner_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add playlist to library"),
			}),
	});
}
