import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import { getEventRoleCapabilities } from "./eventRoleCapabilities";

/**
 * Schema validating payload for adding a user to an event.
 *
 * Expected fields: `event_id`, `user_id`, and `role`.
 */
const EventUserAddSchema = Schema.Struct({
	event_id: Schema.String,
	user_id: Schema.String,
	role: Schema.Literal("participant", "event_admin", "event_playlist_admin"),
	status: Schema.optional(Schema.Literal("invited", "joined")),
});

type EventUserAddData = Schema.Schema.Type<typeof EventUserAddSchema>;

/**
 * Server-side handler for adding a user to an event. This Effect-based handler:
 * - validates the incoming request
 * - verifies the requester is owner or event admin
 * - adds the user to event_user table
 * - automatically adds active playlist/song to user's libraries if applicable
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns Success indicator or fails with an error.
 */
export default function eventUserAdd(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* eventUserAddGen($) {
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
		const validated: EventUserAddData = yield* $(
			validateFormEffect({
				schema: EventUserAddSchema,
				data: body,
				i18nMessageKey: "EVENT_USER_ADD",
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
		const status = validated.status ?? "invited";

		// Create Supabase client with service role key to bypass RLS
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Verify the requester is owner or admin
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
						message: "Only event owners and event admins can add participants",
					}),
				),
			);
		}

		// Verify the target user exists
		const targetUser = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("user").select("user_id").eq("user_id", user_id).single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to verify user exists: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (targetUser.error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Target user not found",
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
							event_id,
							user_id,
							role,
							status,
						},
					]),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to add user to event: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (addResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: addResult.error?.message ?? "Failed to add user to event",
					}),
				),
			);
		}

		// Get event's active playlist and song
		const eventData = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("event_public")
						.select("active_playlist_id, active_song_id, owner_id")
						.eq("event_id", event_id)
						.single(),
				catch: (err) =>
					new DatabaseError({
						message: `Failed to get event data: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (eventData.data) {
			const { active_playlist_id, active_song_id, owner_id } = eventData.data;

			// Add active playlist to user's library if it exists
			const activePlaylistId = active_playlist_id ?? undefined;
			if (activePlaylistId !== undefined && activePlaylistId !== "") {
				yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("playlist_library").insert([
								{
									user_id,
									playlist_id: activePlaylistId,
									playlist_owner_id: owner_id,
								},
							]),
						catch: (err) => {
							// Non-fatal: user might already have it in their library
							console.warn(
								`Failed to add playlist to user library (non-fatal): ${extractErrorMessage(err, "Unknown error")}`,
							);
							return undefined;
						},
					}).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
				);
			}

			// Add active song to user's library if it exists
			const activeSongId = active_song_id ?? undefined;
			if (activeSongId !== undefined && activeSongId !== "") {
				// First get the song owner
				const songData = yield* $(
					Effect.tryPromise({
						try: () =>
							supabase.from("song_public").select("user_id").eq("song_id", activeSongId).single(),
						catch: () => undefined,
					}).pipe(Effect.catchAll(() => Effect.succeed({ data: undefined }))),
				);

				const songOwnerId = songData.data?.user_id ?? undefined;
				if (songOwnerId !== undefined && songOwnerId !== "") {
					yield* $(
						Effect.tryPromise({
							try: () =>
								supabase.from("song_library").insert([
									{
										user_id,
										song_id: activeSongId,
										song_owner_id: songOwnerId,
									},
								]),
							catch: (err) => {
								// Non-fatal: user might already have it in their library
								console.warn(
									`Failed to add song to user library (non-fatal): ${extractErrorMessage(err, "Unknown error")}`,
								);
								return undefined;
							},
						}).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
					);
				}
			}
		}

		return { success: true };
	});
}
