import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const CommunityUserRemoveSchema = Schema.Struct({
	community_id: Schema.String,
});

/**
 * Server-side handler for a user to leave a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityUserRemove(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityUserRemoveGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id } = yield* $(
			Schema.decodeUnknown(CommunityUserRemoveSchema)(body).pipe(
				Effect.mapError(() => new ValidationError({ message: "community_id is required" })),
			),
		);

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Leave community
		const leaveResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.update({ status: "left" })
						.eq("community_id", community_id)
						.eq("user_id", userId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to leave community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (leaveResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: leaveResult.error?.message ?? "Failed to leave community",
					}),
				),
			);
		}

		return { success: true };
	});
}
