// supabase client type imported below via ReadonlySupabaseClient alias
import { Effect, Schema } from "effect";

import type { ReadonlySupabaseClient } from "@/api/supabase/supabase-client";

import { DatabaseError } from "@/api/errors";
import { UserPublicSchema } from "@/shared/generated/supabaseSchemas";

/**
 * Resolve username from `user_public` table for a given user_id.
 * Returns the username string or undefined when not found.
 */
export function resolveUsername(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	supabase: ReadonlySupabaseClient,
	existingUser: Readonly<{ user_id: string; name: string }>,
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
			// Supabase `maybeSingle()` returns `data: null` when no row is found.
			// Treat both `undefined` and `null` as "not found".
			const upData = (upRes as unknown as { data?: unknown }).data;
			if (upData === undefined || upData === null) {
				return undefined;
			}

			const validated = Schema.decodeUnknownSync(UserPublicSchema)(
				upData as unknown,
			);
			return validated.username;
		},
		catch: (err) => new DatabaseError({ message: String(err) }),
	});
}
