import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { communityEventAddSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import { getCommunityRoleCapabilities } from "../community-user/communityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type CommunityEventAddData = Schema.Schema.Type<typeof communityEventAddSchema>;

/**
 * Server-side handler for adding an event to a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityEventAdd(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityEventAddGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const validated: CommunityEventAddData = yield* $(
			validateFormEffect({
				schema: communityEventAddSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_EVENT_ADD",
			}).pipe(
				Effect.mapError((errs) => {
					const first =
						Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		const { community_id, event_id } = validated;

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the requester is community owner or admin
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

		// Add event to community_event table
		const addResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("community_event").insert([
						{
							community_id,
							event_id,
						},
					]),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to add event to community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (addResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: addResult.error?.message ?? "Failed to add event to community",
					}),
				),
			);
		}

		// AUTOMATIC INVITATION LOGIC:
		// When an event is added to a community, automatically invite all
		// currently joined community members to that event.
		const communityMembers = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("user_id")
						.eq("community_id", community_id)
						.eq("status", "joined"),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to get community members: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (communityMembers.data && communityMembers.data.length > ZERO) {
			for (const { user_id } of communityMembers.data) {
				// We don't fail if individual event invitations fail
				yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("event_user").insert([
								{
									event_id,
									user_id,
									role: "participant",
									status: "invited",
								},
							]),
						catch: () => undefined,
					}).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
				);
			}
		}

		return { success: true };
	});
}
