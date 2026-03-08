import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { communitySongAddSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getCommunityRoleCapabilities from "../community-user/getCommunityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type CommunitySongAddData = Schema.Schema.Type<typeof communitySongAddSchema>;

export default function communitySongAdd(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communitySongAddGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);
		const validated: CommunitySongAddData = yield* $(
			validateFormEffect({
				schema: communitySongAddSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_SONG_ADD",
			}).pipe(
				Effect.mapError((errs) => {
					const first = Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({ message: first?.message ?? "Validation failed" });
				}),
			),
		);
		const supabase = createClient<Database>(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
		const requesterRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("role")
						.eq("community_id", validated.community_id)
						.eq("user_id", requesterId)
						.single(),
				catch: (err) => new DatabaseError({ message: extractErrorMessage(err, "Failed to verify permissions") }),
			}),
		);
		if (requesterRole.error) {
			return yield* $(Effect.fail(new ValidationError({ message: "Community not found or not manageable" })));
		}
		if (!getCommunityRoleCapabilities(requesterRole.data?.role).canManageEvents) {
			return yield* $(Effect.fail(new ValidationError({ message: "Only community owners and admins can add songs" })));
		}
		const insertResult = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("community_song").insert([{ community_id: validated.community_id, song_id: validated.song_id }]),
				catch: (err) => new DatabaseError({ message: extractErrorMessage(err, "Failed to add song to community") }),
			}),
		);
		if (insertResult.error) {
			return yield* $(Effect.fail(new DatabaseError({ message: insertResult.error.message ?? "Failed to add song to community" })));
		}
		return { success: true };
	});
}
