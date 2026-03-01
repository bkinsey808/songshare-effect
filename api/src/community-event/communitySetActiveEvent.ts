import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getCommunityRoleCapabilities from "../community-user/getCommunityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const CommunitySetActiveEventSchema = Schema.Struct({
	community_id: Schema.String,
	event_id: Schema.optional(Schema.String),
});

/**
 * Server-side handler for setting or clearing the active event of a community.
 * Pass `event_id` to set, omit it to clear.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communitySetActiveEvent(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communitySetActiveEventGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id, event_id } = yield* $(
			Schema.decodeUnknown(CommunitySetActiveEventSchema)(body).pipe(
				Effect.mapError(() => new ValidationError({ message: "community_id is required" })),
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
						message: "Only community owners and admins can set the active event",
					}),
				),
			);
		}

		// Update active_event_id on community_public (service-role bypasses RLS)
		// Pass undefined to supabase as null to clear the active event
		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_public")
						// oxlint-disable-next-line no-null -- Supabase requires null to clear FK
						.update({ active_event_id: event_id ?? null })
						.eq("community_id", community_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to update active event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (updateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: updateResult.error.message ?? "Failed to update active event",
					}),
				),
			);
		}

		return { success: true };
	});
}
