import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type EventLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type AddEventRequest = {
	event_id: string;
};

type EventLibraryRow = Database["public"]["Tables"]["event_library"]["Row"];

/**
 * Extract and validate the request payload for adding an event to the library.
 *
 * Ensures the incoming `request` is an object and contains an `event_id`
 * property of type string. Returns a sanitized `AddEventRequest` on success.
 *
 * @param request - The raw request payload (typically parsed JSON).
 * @returns - A validated `AddEventRequest` containing `event_id`.
 * @throws - `TypeError` when the request is not an object, is missing required
 *   properties, or when `event_id` is not a string.
 */
function extractAddEventRequest(request: unknown): AddEventRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("event_id" in request)) {
		throw new TypeError("Request must contain event_id");
	}

	const { event_id } = request as Record<string, unknown>;

	if (typeof event_id !== "string") {
		throw new TypeError("event_id must be a string");
	}

	return { event_id };
}

/**
 * Perform the Supabase insert for event_library.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing event_id
 * @returns Insert result or error
 */
function performInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddEventRequest,
): Effect.Effect<PostgrestSingleResponse<EventLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			// First fetch the event to get event_owner_id
			const eventResult = await client
				.from("event_public")
				.select("owner_id")
				.eq("event_id", req.event_id)
				.single();

			if (eventResult.error) {
				throw new Error(`Event not found: ${eventResult.error.message}`);
			}

			const eventOwnerId = eventResult.data?.owner_id;
			if (!eventOwnerId) {
				throw new Error("Event owner not found");
			}

			// Now insert into event_library
			return client
				.from("event_library")
				.insert([
					{
						user_id: userId,
						event_id: req.event_id,
						event_owner_id: eventOwnerId,
					},
				])
				.select()
				.single();
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add event to library"),
			}),
	});
}

/**
 * Server-side handler for adding an event to the current user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into event_library using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The inserted event library entry, or fails with an error
 */
export default function addEventToLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<EventLibrary, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addEventToLibraryGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request structure
		let req: AddEventRequest = { event_id: "" };
		try {
			req = extractAddEventRequest(requestBody);
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
				),
			);
		}

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Insert into event_library using service key
		const insertResult = yield* $(performInsert(client, userId, req));

		const { data, error: insertError } = insertResult;

		if (insertError !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(insertError, "Unknown error"),
					}),
				),
			);
		}

		if (data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "No data returned from insert" })));
		}

		const libraryEntry: EventLibrary = {
			created_at: data.created_at,
			event_id: data.event_id,
			user_id: data.user_id,
			event_owner_id: data.event_owner_id,
		};

		return libraryEntry;
	});
}
