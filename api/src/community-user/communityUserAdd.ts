import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { communityUserAddSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import getCommunityRoleCapabilities from "./getCommunityRoleCapabilities";

type CommunityUserAddData = Schema.Schema.Type<typeof communityUserAddSchema>;

/**
 * Server-side handler for adding a user to a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityUserAdd(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityUserAddGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const validated: CommunityUserAddData = yield* $(
			validateFormEffect({
				schema: communityUserAddSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_USER_ADD",
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

		const { community_id, user_id, role } = validated;
		const status = validated.status ?? "invited";

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
						message: "Community not found or you do not have permission to manage members",
					}),
				),
			);
		}

		const requesterCapabilities = getCommunityRoleCapabilities(requesterRole.data?.role);

		if (!requesterCapabilities.canManageMembers) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only community owners and admins can add members",
					}),
				),
			);
		}

		// Verify target user exists
		const targetUser = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("user").select("user_id").eq("user_id", user_id).single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify user exists: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (targetUser.error) {
			return yield* $(Effect.fail(new ValidationError({ message: "Target user not found" })));
		}

		// Verify user is not already in the community
		const existingMembership = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("status")
						.eq("community_id", community_id)
						.eq("user_id", user_id)
						.maybeSingle(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify existing membership: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (existingMembership.data) {
			const { status: existingStatus } = existingMembership.data;
			if (existingStatus === "joined") {
				return yield* $(
					Effect.fail(
						new ValidationError({ message: "User is already a member of this community" }),
					),
				);
			}
			if (existingStatus === "invited") {
				return yield* $(
					Effect.fail(
						new ValidationError({ message: "User has already been invited to this community" }),
					),
				);
			}
			// If they left or were kicked, we might want to allow re-inviting them.
			// For now, let's just proceed with update if they are not joined/invited.
		}

		// Add user to community_user table
		const addResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("community_user").upsert(
						[
							{
								community_id,
								user_id,
								role,
								status,
							},
						],
						{ onConflict: "community_id,user_id" },
					),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to add user to community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (addResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: addResult.error?.message ?? "Failed to add user to community",
					}),
				),
			);
		}

		// AUTOMATIC INVITATION LOGIC:
		// When a user is added to a community (invited or joined),
		// automatically invite them to all events currently associated with that community.
		const communityEvents = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("community_event").select("event_id").eq("community_id", community_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to get community events: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (communityEvents.data && communityEvents.data.length > ZERO) {
			for (const { event_id } of communityEvents.data) {
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
