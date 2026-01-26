import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const DeleteSongBodySchema = Schema.Struct({
	song_id: Schema.String,
});

type DeleteSongBody = Schema.Schema.Type<typeof DeleteSongBodySchema>;

/**
 * Effect-based handler for deleting a song. The authenticated user must own
 * the song. Deletes the row from `song`; `song_public` and `song_library`
 * are removed by FK ON DELETE CASCADE.
 */
export default function songDelete(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: true }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* songDeleteGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: () => ctx.req.json(),
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const validated: DeleteSongBody = yield* $(
			validateFormEffect({
				schema: DeleteSongBodySchema,
				data: body,
				i18nMessageKey: "DELETE_SONG",
			}).pipe(
				Effect.mapError((errs) => {
					const [first] = Array.isArray(errs) ? errs : [];
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		const songId = validated.song_id.trim();
		if (songId === "") {
			return yield* $(Effect.fail(new ValidationError({ message: "song_id is required" })));
		}

		const supabaseUrl = ctx.env.VITE_SUPABASE_URL;
		const supabaseServiceKey = ctx.env.SUPABASE_SERVICE_KEY;
		const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

		const result = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("song").delete().eq("song_id", songId).eq("user_id", userId),
				catch: (err) =>
					new DatabaseError({
						message: getErrorMessage(err) || "Failed to delete song",
					}),
			}),
		);

		if (result.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: result.error.message ?? "Failed to delete song",
					}),
				),
			);
		}

		return { success: true as const };
	});
}
