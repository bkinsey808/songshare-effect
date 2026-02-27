import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import { getCommunityRoleCapabilities } from "./communityRoleCapabilities";

const CommunityUserKickSchema = Schema.Struct({
	community_id: Schema.String,
	user_id: Schema.String,
});

/**
 * Server-side handler for kicking a user from a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityUserKick(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityUserKickGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id, user_id } = yield* $(
			Schema.decodeUnknown(CommunityUserKickSchema)(body).pipe(
				Effect.mapError(
					() => new ValidationError({ message: "community_id and user_id are required" }),
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
						message: "Community not found or you do not have permission to kick members",
					}),
				),
			);
		}

		const requesterCapabilities = getCommunityRoleCapabilities(requesterRole.data?.role);

		if (!requesterCapabilities.canManageMembers) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only community owners and admins can kick members",
					}),
				),
			);
		}

		// Kick member
		const kickResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.update({ status: "kicked" })
						.eq("community_id", community_id)
						.eq("user_id", user_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to kick member: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (kickResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: kickResult.error?.message ?? "Failed to kick member",
					}),
				),
			);
		}

		return { success: true };
	});
}
