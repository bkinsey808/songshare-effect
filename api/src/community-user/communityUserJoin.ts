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

		// Check if user is already a member or has been kicked
		const existingUser = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("status")
						.eq("community_id", community_id)
						.eq("user_id", userId)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to check membership: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (existingUser.data?.status === "kicked") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "You have been kicked from this community and cannot join again.",
					}),
				),
			);
		}

		if (existingUser.data?.status === "joined") {
			return { success: true };
		}

		// Join community
		const joinResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (existingUser.data?.status === "invited" || existingUser.data?.status === "left") {
						return supabase
							.from("community_user")
							.update({ status: "joined" })
							.eq("community_id", community_id)
							.eq("user_id", userId);
					}
					return supabase.from("community_user").insert([
						{
							community_id,
							user_id: userId,
							role: "member",
							status: "joined",
						},
					]);
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to join community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (joinResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: joinResult.error?.message ?? "Failed to join community",
					}),
				),
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
