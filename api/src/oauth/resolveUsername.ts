import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import { DatabaseError } from "@/api/errors";
import { UserPublicSchema } from "@/shared/generated/supabaseSchemas";

/**
 * Resolve username from `user_public` table for a given user_id.
 * Returns the username string or undefined when not found.
 */
export function resolveUsername(
	supabase: SupabaseClient,
	existingUser: { user_id: string; name: string },
): Effect.Effect<string | undefined, DatabaseError> {
	return Effect.tryPromise<string | undefined, DatabaseError>({
		try: async () => {
			const upRes = await supabase
				.from("user_public")
				.select("user_id,username")
				.eq("user_id", existingUser.user_id)
				.maybeSingle();
			if (upRes.error) {
				throw upRes.error;
			}
			if ((upRes as unknown as { data?: unknown }).data === undefined) {
				return undefined;
			}
			const validated = Schema.decodeUnknownSync(UserPublicSchema)(
				upRes.data as unknown,
			);
			return validated.username;
		},
		catch: (err) => new DatabaseError({ message: String(err) }),
	});
}
