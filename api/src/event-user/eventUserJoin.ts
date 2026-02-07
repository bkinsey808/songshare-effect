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
 * Schema validating payload for joining an event.
 *
 * Expected shape: `{ event_id: string }`.
 */
const EventUserJoinSchema = Schema.Struct({
	event_id: Schema.String,
});

type EventUserJoinData = Schema.Schema.Type<typeof EventUserJoinSchema>;

/**
 * Server-side handler for adding the current user as a participant to an event.
 * This Effect-based handler:
 * - validates the incoming request
 * - adds the current user to the event_user table with role='participant'
 * - uses service role key to bypass RLS
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success indicator or fails with an error
 */
export default function eventUserJoin(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventUserJoinGen($) {
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

		// Validate form payload
		const validated: EventUserJoinData = yield* $(
			validateFormEffect({
				schema: EventUserJoinSchema,
				data: body,
				i18nMessageKey: "EVENT_USER_JOIN",
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

		// Create Supabase client with service role key to bypass RLS
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify event exists
		const eventExists = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("event").select("event_id").eq("event_id", validated.event_id).single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (eventExists.error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Event not found",
					}),
				),
			);
		}

		// Add user to event_user table
		const addResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("event_user").insert([
						{
							event_id: validated.event_id,
							user_id: userId,
							role: "participant",
						},
					]),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to join event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (addResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: addResult.error?.message ?? "Failed to join event",
					}),
				),
			);
		}

		return { success: true };
	});
}
