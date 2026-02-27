import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const CommunityDeleteSchema = Schema.Struct({
	community_id: Schema.String,
});

/**
 * Server-side handler for deleting a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityDelete(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityDeleteGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id } = yield* $(
			Schema.decodeUnknown(CommunityDeleteSchema)(body).pipe(
				Effect.mapError(() => new ValidationError({ message: "community_id is required" })),
			),
		);

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the user owns the community
		const userRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("role")
						.eq("community_id", community_id)
						.eq("user_id", userId)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify community permissions: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (userRole.error || userRole.data?.role !== "owner") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Community not found or you do not have permission to delete it",
					}),
				),
			);
		}

		// Delete community (cascades to community_public, community_user, community_event)
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("community").delete().eq("community_id", community_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to delete community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (deleteResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: deleteResult.error?.message ?? "Failed to delete community",
					}),
				),
			);
		}

		return { success: true };
	});
}
