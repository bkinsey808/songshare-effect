/* oxlint-disable max-lines */
import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import { getEventRoleCapabilities } from "../event-user/eventRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

/**
 * Schema validating event save form payload.
 *
 * Validates optional `event_id` and required fields like `event_name` and
 * `event_slug`, along with optional metadata and active item ids.
 */
const EventFormSchema = Schema.Struct({
	event_id: Schema.optional(Schema.String),
	event_name: Schema.optional(Schema.String),
	event_slug: Schema.optional(Schema.String),
	event_description: Schema.optional(Schema.String),
	event_date: Schema.optional(Schema.String),
	is_public: Schema.optional(Schema.Boolean),
	active_playlist_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_song_id: Schema.optional(Schema.NullishOr(Schema.String)),
	active_slide_position: Schema.optional(Schema.NullishOr(Schema.Number)),
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
});

type EventFormData = Schema.Schema.Type<typeof EventFormSchema>;

/**
 * Server-side handler for saving an event. This Effect-based handler:
 * - validates the incoming form payload
 * - creates a private event row, then a public event row
 * - creates an event_user entry with role='owner'
 * - attempts cleanup if any step fails
 *
 * The function returns the created public record or fails with a
 * ValidationError | DatabaseError | AuthenticationError.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The public record that was created in `event_public` (or a
 * failed Effect with a ValidationError/DatabaseError/AuthenticationError).
 */
export default function eventSave(
	ctx: ReadonlyContext,
): Effect.Effect<unknown, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventSaveGen($) {
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
		const validated: EventFormData = yield* $(
			validateFormEffect({
				schema: EventFormSchema,
				data: body,
				i18nMessageKey: "EVENT_FORM",
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

		// Create Supabase client with service role key to bypass RLS for writes
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Determine if this is an update or create operation
		const isUpdate = validated.event_id !== undefined && validated.event_id.trim() !== "";
		const eventId = isUpdate ? validated.event_id : crypto.randomUUID();

		if (!isUpdate) {
			if (validated.event_name === undefined || validated.event_name.trim() === "") {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "event_name is missing",
						}),
					),
				);
			}

			if (validated.event_slug === undefined || validated.event_slug.trim() === "") {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "event_slug is missing",
						}),
					),
				);
			}
		}

		// If updating, verify the user owns the event or is an admin
		if (isUpdate) {
			const userRole = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase
							.from("event_user")
							.select("role")
							.eq("event_id", eventId)
							.eq("user_id", userId)
							.single(),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to verify event permissions: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (userRole.error) {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "Event not found or you do not have permission to update it",
						}),
					),
				);
			}

			const roleCapabilities = getEventRoleCapabilities(userRole.data?.role);

			if (!roleCapabilities.canUpdateEventPlaybackFields) {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "You do not have permission to update this event",
						}),
					),
				);
			}

			if (!roleCapabilities.canUpdateEventAllFields) {
				const restrictedFields: (keyof EventFormData)[] = [
					"event_name",
					"event_description",
					"event_slug",
					"is_public",
					"event_date",
					"private_notes",
					"public_notes",
				];
				const attemptedRestrictedUpdate = restrictedFields.some(
					(field) => validated[field] !== undefined,
				);

				if (attemptedRestrictedUpdate) {
					return yield* $(
						Effect.fail(
							new ValidationError({
								message:
									"Event playlist admins can only update active playlist, active song, and active slide",
							}),
						),
					);
				}
			}
		}

		// Update or insert private event data
		const privateResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						if (validated.private_notes === undefined) {
							return supabase.from("event").select("event_id").eq("event_id", eventId).single();
						}

						return supabase
							.from("event")
							.update({
								private_notes: validated.private_notes,
							})
							.eq("event_id", eventId)
							.select()
							.single();
					}
					return supabase
						.from("event")
						.insert([
							{
								event_id: eventId,
								owner_id: userId,
								private_notes: validated.private_notes ?? "",
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} private event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (privateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: privateResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Update or insert into public table (event_public)
		const publicResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						// Build update object based on what fields are provided
						const updateData: Record<string, unknown> = {};

						if (validated.event_name !== undefined) {
							updateData.event_name = validated.event_name;
						}
						if (validated.event_description !== undefined) {
							updateData.event_description = validated.event_description;
						}

						// Add optional fields if provided
						if (validated.event_slug !== undefined) {
							updateData.event_slug = validated.event_slug;
						}
						if (validated.is_public !== undefined) {
							updateData.is_public = validated.is_public;
						}
						if (validated.event_date !== undefined) {
							updateData.event_date = validated.event_date;
						}
						if (validated.active_playlist_id !== undefined) {
							/* oxlint-disable-next-line unicorn/no-null */
							updateData.active_playlist_id = validated.active_playlist_id ?? null;
						}
						if (validated.active_song_id !== undefined) {
							/* oxlint-disable-next-line unicorn/no-null */
							updateData.active_song_id = validated.active_song_id ?? null;
						}
						if (validated.active_slide_position !== undefined) {
							/* oxlint-disable-next-line unicorn/no-null */
							updateData.active_slide_position = validated.active_slide_position ?? null;
						}
						if (validated.public_notes !== undefined) {
							/* oxlint-disable-next-line unicorn/no-null */
							updateData.public_notes = validated.public_notes ?? null;
						}

						if (Object.keys(updateData).length === ZERO) {
							return supabase.from("event_public").select().eq("event_id", eventId).single();
						}

						return supabase
							.from("event_public")
							.update(updateData)
							.eq("event_id", eventId)
							.select()
							.single();
					}
					return supabase
						.from("event_public")
						.insert([
							{
								event_id: eventId,
								owner_id: userId,
								event_name: validated.event_name ?? "",
								event_slug: validated.event_slug ?? "",
								event_description: validated.event_description ?? "",
								/* oxlint-disable-next-line unicorn/no-null */
								event_date: validated.event_date ?? null,
								is_public: validated.is_public ?? false,
								/* oxlint-disable-next-line unicorn/no-null */
								active_playlist_id: validated.active_playlist_id ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								active_song_id: validated.active_song_id ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								active_slide_position: validated.active_slide_position ?? null,
								/* oxlint-disable-next-line unicorn/no-null */
								public_notes: validated.public_notes ?? null,
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} public event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (publicResult.error) {
			// Only attempt cleanup if this was a create operation
			if (!isUpdate) {
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("event").delete().eq("event_id", eventId),
							catch: () => undefined,
						}),
					);
				} catch {
					// Cleanup failed but continue with error reporting
				}
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: publicResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Only create event_user entry if this is a new event
		if (!isUpdate) {
			const eventUserResult = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("event_user").insert([
							{
								event_id: eventId,
								user_id: userId,
								role: "owner",
							},
						]),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to create event owner entry: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (eventUserResult.error) {
				// Cleanup: delete event_public and event
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("event").delete().eq("event_id", eventId),
							catch: () => undefined,
						}),
					);
				} catch {
					// Cleanup failed but continue with error reporting
				}

				return yield* $(
					Effect.fail(
						new DatabaseError({
							message: eventUserResult.error?.message ?? "Failed to create event owner entry",
						}),
					),
				);
			}

			// Automatically add newly created event to owner's library
			const eventLibraryResult = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("event_library").insert([
							{
								user_id: userId,
								event_id: eventId,
								event_owner_id: userId,
							},
						]),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to add event to owner's library: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (eventLibraryResult.error) {
				// Non-fatal: log but don't fail the event creation
				console.warn(
					`Failed to add event ${eventId} to owner's library (non-fatal):`,
					eventLibraryResult.error.message,
				);
			}
		}

		// Return updated/created public record
		return publicResult.data;
	});
}
