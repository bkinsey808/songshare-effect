import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { communityShareRequestUpdateStatusSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getCommunityRoleCapabilities from "../community-user/getCommunityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type CommunityShareRequestUpdateStatusData = Schema.Schema.Type<
	typeof communityShareRequestUpdateStatusSchema
>;

export default function communityShareRequestUpdateStatus(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityShareRequestUpdateStatusGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const reviewerId = userSession.user.user_id;
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);
		const validated: CommunityShareRequestUpdateStatusData = yield* $(
			validateFormEffect({
				schema: communityShareRequestUpdateStatusSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_SHARE_REQUEST_UPDATE_STATUS",
			}).pipe(
				Effect.mapError((errs) => {
					const first =
						Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({ message: first?.message ?? "Validation failed" });
				}),
			),
		);
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);
		const requestResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_share_request")
						.select("community_id, shared_item_type, shared_item_id, status")
						.eq("request_id", validated.request_id)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to load community share request"),
					}),
			}),
		);
		if (requestResult.error || requestResult.data === null) {
			return yield* $(
				Effect.fail(new ValidationError({ message: "Community share request not found" })),
			);
		}
		if (requestResult.data.status !== "pending") {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: "Community share request has already been reviewed" }),
				),
			);
		}
		const requesterRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("role")
						.eq("community_id", requestResult.data.community_id)
						.eq("user_id", reviewerId)
						.single(),
				catch: (err) =>
					new DatabaseError({ message: extractErrorMessage(err, "Failed to verify permissions") }),
			}),
		);
		if (
			requesterRole.error ||
			!getCommunityRoleCapabilities(requesterRole.data?.role).canManageEvents
		) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only community owners and admins can review share requests",
					}),
				),
			);
		}
		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_share_request")
						.update({
							status: validated.status,
							reviewed_by_user_id: reviewerId,
							reviewed_at: new Date().toISOString(),
						})
						.eq("request_id", validated.request_id),
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to review community share request"),
					}),
			}),
		);
		if (updateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: updateResult.error.message ?? "Failed to review community share request",
					}),
				),
			);
		}
		if (validated.status === "accepted") {
			if (requestResult.data.shared_item_type === "song") {
				const addSongResult = yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("community_song").upsert([
								{
									community_id: requestResult.data.community_id,
									song_id: requestResult.data.shared_item_id,
								},
							]),
						catch: (err) =>
							new DatabaseError({
								message: extractErrorMessage(err, "Failed to add approved song to community"),
							}),
					}),
				);
				if (addSongResult.error) {
					return yield* $(
						Effect.fail(
							new DatabaseError({
								message: addSongResult.error.message ?? "Failed to add approved song to community",
							}),
						),
					);
				}
			}
			if (requestResult.data.shared_item_type === "playlist") {
				const addPlaylistResult = yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("community_playlist").upsert([
								{
									community_id: requestResult.data.community_id,
									playlist_id: requestResult.data.shared_item_id,
								},
							]),
						catch: (err) =>
							new DatabaseError({
								message: extractErrorMessage(err, "Failed to add approved playlist to community"),
							}),
					}),
				);
				if (addPlaylistResult.error) {
					return yield* $(
						Effect.fail(
							new DatabaseError({
								message:
									addPlaylistResult.error.message ?? "Failed to add approved playlist to community",
							}),
						),
					);
				}
			}
		}
		return { success: true };
	});
}
