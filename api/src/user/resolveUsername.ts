// supabase client type imported below via ReadonlySupabaseClient alias
import { Effect } from "effect";

import { DatabaseError } from "@/api/errors";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import { type ReadonlySupabaseClient } from "@/api/supabase/supabase-client";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { UserPublicSchema } from "@/shared/generated/supabaseSchemas";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Resolve username from `user_public` table for a given user_id.
 * Returns the username string or undefined when not found.
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
