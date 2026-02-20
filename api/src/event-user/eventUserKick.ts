import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import { getEventRoleCapabilities } from "./eventRoleCapabilities";

const EventUserKickSchema = Schema.Struct({
	event_id: Schema.String,
	user_id: Schema.String,
});

type EventUserKickData = Schema.Schema.Type<typeof EventUserKickSchema>;

/**
 * Sets a participant membership status to kicked.
 *
 * Only event owners and event admins can kick participants.
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success indicator or fails with an error
 */
export default function eventUserKick(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventUserKickGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const validated: EventUserKickData = yield* $(
			validateFormEffect({
				schema: EventUserKickSchema,
				data: body,
				i18nMessageKey: "EVENT_USER_KICK",
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

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		const requesterRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.select("role")
						.eq("event_id", validated.event_id)
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
						message: "Event not found or you do not have permission to manage participants",
					}),
				),
			);
		}

		const requesterCapabilities = getEventRoleCapabilities(requesterRole.data?.role);
		if (!requesterCapabilities.canManageParticipants) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only event owners and event admins can kick participants",
					}),
				),
			);
		}

		const targetRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.select("role")
						.eq("event_id", validated.event_id)
						.eq("user_id", validated.user_id)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify target role: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (targetRole.error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "User is not a participant of this event",
					}),
				),
			);
		}

		if (targetRole.data?.role === "owner") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Cannot kick the event owner",
					}),
				),
			);
		}

		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.update({ status: "kicked" })
						.eq("event_id", validated.event_id)
						.eq("user_id", validated.user_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to kick user: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (updateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: updateResult.error.message,
					}),
				),
			);
		}

		return { success: true };
	});
}
