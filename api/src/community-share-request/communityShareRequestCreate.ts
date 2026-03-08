import { createClient } from "@supabase/supabase-js";
import { Effect, type Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { communityShareRequestCreateSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type CommunityShareRequestCreateData = Schema.Schema.Type<typeof communityShareRequestCreateSchema>;

export default function communityShareRequestCreate(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communityShareRequestCreateGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const senderUserId = userSession.user.user_id;
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => (await ctx.req.json()) as unknown,
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);
		const validated: CommunityShareRequestCreateData = yield* $(
			validateFormEffect({
				schema: communityShareRequestCreateSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_SHARE_REQUEST_CREATE",
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
		const membership = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("status")
						.eq("community_id", validated.community_id)
						.eq("user_id", senderUserId)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to verify community membership"),
					}),
			}),
		);
		if (membership.error || membership.data?.status !== "joined") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only joined community members can submit share requests",
					}),
				),
			);
		}
		const insertResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("community_share_request").insert([
						{
							community_id: validated.community_id,
							sender_user_id: senderUserId,
							shared_item_type: validated.shared_item_type,
							shared_item_id: validated.shared_item_id,
							message: validated.message ?? "",
						},
					]),
				catch: (err) =>
					new DatabaseError({
						message: extractErrorMessage(err, "Failed to submit community share request"),
					}),
			}),
		);
		if (insertResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: insertResult.error.message ?? "Failed to submit community share request",
					}),
				),
			);
		}
		return { success: true };
	});
}
