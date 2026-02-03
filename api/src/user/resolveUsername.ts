// supabase client type imported below via ReadonlySupabaseClient alias
import { Effect } from "effect";

import { DatabaseError } from "@/api/api-errors";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import { type ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { UserPublicSchema } from "@/shared/generated/supabaseSchemas";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Resolve a user's public username from the `user_public` table.
 *
 * Looks up the record for the provided `existingUser.user_id`. If a matching
 * `user_public` row exists its `username` is validated and returned. If no
 * record is found `undefined` is returned.
 *
 * @param supabase - Read-only Supabase client used to perform the query.
 * @param existingUser - Object containing the `user_id` to look up and the user's name.
 * @returns - An Effect that resolves to the username string or `undefined` if not found.
 *   If the query fails or the data does not validate, the Effect fails with a
 *   `DatabaseError`.
 */
export default function resolveUsername(
	supabase: ReadonlySupabaseClient,
	existingUser: Readonly<{ user_id: string; name: string }>,
): Effect.Effect<string | undefined, DatabaseError> {
	return Effect.tryPromise<string | undefined, DatabaseError>({
		try: async () => {
			const rawRes = await supabase
				.from("user_public")
				.select("user_id,username")
				.eq("user_id", existingUser.user_id)
				.maybeSingle();
			const upRes = parseMaybeSingle(rawRes);

			if (upRes.error !== undefined && upRes.error !== null) {
				throw new Error(extractErrorMessage(upRes.error, "Unknown error") ?? "Unknown error");
			}

			if (upRes.data === undefined || upRes.data === null) {
				return undefined;
			}

			const validated = decodeUnknownSyncOrThrow(UserPublicSchema, upRes.data);
			return validated.username;
		},
		catch: (err) => new DatabaseError({ message: extractErrorMessage(err, "Unknown error") }),
	});
}
