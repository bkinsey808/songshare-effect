import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { DatabaseError } from "@/api/api-errors";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import type { AddSongRequest } from "./AddSongRequest.type";

type SongLibraryRow = Database["public"]["Tables"]["song_library"]["Row"];

/**
 * Perform the Supabase insert for song_library.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing song_id and song_owner_id
 * @returns Insert result or error
 */
export default function performSongLibraryInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddSongRequest,
): Effect.Effect<PostgrestSingleResponse<SongLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("song_library")
				.insert([
					{
						user_id: userId,
						song_id: req.song_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add song to library"),
			}),
	});
}
