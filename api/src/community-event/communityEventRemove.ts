import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getCommunityRoleCapabilities from "../community-user/getCommunityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const CommunityEventRemoveSchema = Schema.Struct({
	community_id: Schema.String,
	event_id: Schema.String,
});

/**
 * Server-side handler for removing an event from a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityEventRemove(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityEventRemoveGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id, event_id } = yield* $(
			Schema.decodeUnknown(CommunityEventRemoveSchema)(body).pipe(
				Effect.mapError(
					() => new ValidationError({ message: "community_id and event_id are required" }),
				),
			),
		);

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the requester is owner or admin
		const requesterRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("role")
						.eq("community_id", community_id)
						.eq("user_id", requesterId)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify permissions: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (requesterRole.error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Community not found or you do not have permission to manage events",
					}),
				),
			);
		}

		const requesterCapabilities = getCommunityRoleCapabilities(requesterRole.data?.role);

		if (!requesterCapabilities.canManageEvents) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only community owners and admins can manage community events",
					}),
				),
			);
		}

		// Remove event from community_event table
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_event")
						.delete()
						.eq("community_id", community_id)
						.eq("event_id", event_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to remove event from community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (deleteResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: deleteResult.error?.message ?? "Failed to remove event from community",
					}),
				),
			);
		}

		return { success: true };
	});
}
