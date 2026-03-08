import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError } from "../api-errors";
import type { AddUserRequest } from "./AddUserRequest.type";

/**
 * Row type used when inserting into `user_library`.
 * Exported for tests that need to construct mock results.
 */
export type UserLibraryRow = Database["public"]["Tables"]["user_library"]["Row"];

/**
 * Perform the Supabase insert for user_library.
 *
 * This helper is primarily consumed by the real handler; separating it keeps
 * the handler lean and allows non-handler callers (including unit tests) to
 * work with the returned Effect directly.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing followed_user_id
 * @returns Insert result or error
 */
export default function performUserLibraryInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddUserRequest,
): Effect.Effect<PostgrestSingleResponse<UserLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("user_library")
				.insert([
					{
						user_id: userId,
						followed_user_id: req.followed_user_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add user to library"),
			}),
	});
}
