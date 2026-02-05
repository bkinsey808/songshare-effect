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
 * Schema validating payload for deleting an event.
 *
 * Expected shape: `{ event_id: string }`.
 */
const EventDeleteSchema = Schema.Struct({
	event_id: Schema.String,
});

type EventDeleteData = Schema.Schema.Type<typeof EventDeleteSchema>;

/**
 * Server-side handler for deleting an event. This Effect-based handler:
 * - validates the incoming request
 * - verifies the user owns the event (only owners can delete)
 * - deletes the event_user entries, then public and private event data
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function eventDelete(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventDeleteGen($) {
		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

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
		const validated: EventDeleteData = yield* $(
			validateFormEffect({
				schema: EventDeleteSchema,
				data: body,
				i18nMessageKey: "EVENT_DELETE",
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

		const eventId = validated.event_id;

		// Create Supabase client with service role key to bypass RLS
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the user owns the event (only owners can delete)
		const existingEvent = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("event").select("owner_id").eq("event_id", eventId).single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify event ownership: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (existingEvent.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: existingEvent.error?.message ?? "Event not found",
					}),
				),
			);
		}

		if (existingEvent.data?.owner_id !== userId) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Only the event owner can delete this event",
					}),
				),
			);
		}

		// Delete all event_user entries for this event
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("event_user").delete().eq("event_id", eventId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to remove event participants: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		// Delete the public event data
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("event_public").delete().eq("event_id", eventId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to delete public event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		// Delete the private event data
		yield* $(
			Effect.tryPromise({
				try: () => supabase.from("event").delete().eq("event_id", eventId),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to delete private event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		return { success: true };
	});
}
