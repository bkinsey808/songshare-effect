import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const CommunityUserJoinSchema = Schema.Struct({
	community_id: Schema.String,
});

/**
 * Server-side handler for joining a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function communityUserJoin(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityUserJoinGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const { community_id } = yield* $(
			Schema.decodeUnknown(CommunityUserJoinSchema)(body).pipe(
				Effect.mapError(() => new ValidationError({ message: "community_id is required" })),
			),
		);

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		console.warn(`[communityUserJoin] User ${userId} is joining community ${community_id}`);

		// Verify community exists and fetch owner_id in one query
		const communityExists = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_public")
						.select("community_id, owner_id")
						.eq("community_id", community_id)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (communityExists.error) {
			return yield* $(Effect.fail(new ValidationError({ message: "Community not found" })));
		}

		// Check if user is already a member or has been kicked
		const existingUser = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("status, role")
						.eq("community_id", community_id)
						.eq("user_id", userId)
						.maybeSingle(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to check membership: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		// Handle explicit kicked status (already checked maybeSingle, so if data is null row doesn't exist)
		if (existingUser.data?.status === "kicked") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "You have been kicked from this community and cannot join again.",
					}),
				),
			);
		}

		// If already joined, succeed early
		if (existingUser.data?.status === "joined") {
			return { success: true };
		}

		// Join/Accept community: update row if it exists (e.g. invited), insert if new
		const query = existingUser.data
			? supabase
					.from("community_user")
					.update({
						status: "joined",
						joined_at: new Date().toISOString(),
						// keep existing role
						role: existingUser.data.role,
					})
					.eq("community_id", community_id)
					.eq("user_id", userId)
			: supabase.from("community_user").insert([
					{
						community_id,
						user_id: userId,
						role: "member",
						status: "joined",
						joined_at: new Date().toISOString(),
					},
				]);

		const joinResult = yield* $(
			Effect.tryPromise({
				try: () => query,
				catch: (err) =>
					new DatabaseError({
						message: `Failed to join community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (joinResult.error) {
			console.error("[communityUserJoin] Error:", joinResult.error);
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: joinResult.error?.message ?? "Failed to join community",
					}),
				),
			);
		}

		// Automatically add joined community to user's library (owner_id already fetched above)
		const communityLibraryResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("community_library").upsert(
						[
							{
								user_id: userId,
								community_id,
							},
						],
						{ onConflict: "user_id,community_id", ignoreDuplicates: true },
					),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to add community to user's library: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (communityLibraryResult.error) {
			// Non-fatal: log but don't fail the community join
			console.warn(
				`Failed to add community ${community_id} to user's library (non-fatal):`,
				communityLibraryResult.error.message,
			);
		}

		// AUTOMATIC INVITATION LOGIC:
		// When a user joins a community, automatically invite them to all events currently associated with that community.
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
				yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("event_user").insert([
								{
									event_id,
									user_id: userId,
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
