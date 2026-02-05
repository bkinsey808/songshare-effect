import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

/**
 * Schema validating payload for updating a user's role in an event.
 *
 * Expected fields: `event_id`, `user_id`, and `role` ("admin" | "participant").
 */
const EventUserUpdateRoleSchema = Schema.Struct({
	event_id: Schema.String,
	user_id: Schema.String,
	role: Schema.Literal("admin", "participant"),
});

type EventUserUpdateRoleData = Schema.Schema.Type<typeof EventUserUpdateRoleSchema>;

/**
 * Server-side handler for updating a user's role in an event. This Effect-based handler:
 * - validates the incoming request
 * - verifies the requester is the owner (only owners can change roles)
 * - updates the user's role in event_user table
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function eventUserUpdateRole(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventUserUpdateRoleGen($) {
		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const requesterId = userSession.user.user_id;

		// Parse JSON body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request payload
		const validated: EventUserUpdateRoleData = yield* $(
			validateFormEffect({
				schema: EventUserUpdateRoleSchema,
				data: body,
				i18nMessageKey: "EVENT_USER_UPDATE_ROLE",
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

		const { event_id, user_id, role } = validated;

		// Create Supabase client with service role key to bypass RLS
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the requester is the owner (only owners can change roles)
		const requesterRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.select("role")
						.eq("event_id", event_id)
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
						message: "Event not found or you do not have permission to manage roles",
					}),
				),
			);
		}

		if (requesterRole.data?.role !== "owner") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only the event owner can change participant roles",
					}),
				),
			);
		}

		// Verify the target user exists in the event
		const targetUserRole = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.select("role")
						.eq("event_id", event_id)
						.eq("user_id", user_id)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify target user: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (targetUserRole.error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "User is not a participant of this event",
					}),
				),
			);
		}

		// Cannot change the owner's role
		if (targetUserRole.data?.role === "owner") {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Cannot change the owner's role",
					}),
				),
			);
		}

		// Update the user's role
		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_user")
						.update({ role })
						.eq("event_id", event_id)
						.eq("user_id", user_id),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to update user role: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (updateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: updateResult.error?.message ?? "Failed to update user role",
					}),
				),
			);
		}

		return { success: true };
	});
}
