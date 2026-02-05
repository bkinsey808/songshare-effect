import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type SongLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type AddSongRequest = {
	song_id: string;
	song_owner_id: string;
};

type SongLibraryRow = Database["public"]["Tables"]["song_library"]["Row"];

/**
 * Extract and validate the request payload for adding a song to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `song_id` and `song_owner_id` strings.
 * @returns - A validated AddSongRequest containing `song_id` and
 *   `song_owner_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `song_id`/`song_owner_id` are missing or not strings.
 */
function extractAddSongRequest(request: unknown): AddSongRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("song_id" in request) || !("song_owner_id" in request)) {
		throw new TypeError("Request must contain song_id and song_owner_id");
	}

	const { song_id, song_owner_id } = request as Record<string, unknown>;

	if (typeof song_id !== "string" || typeof song_owner_id !== "string") {
		throw new TypeError("song_id and song_owner_id must be strings");
	}

	return { song_id, song_owner_id };
}

/**
 * Perform the Supabase insert for song_library.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing song_id and song_owner_id
 * @returns Insert result or error
 */
function performInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddSongRequest,
): Effect.Effect<PostgrestSingleResponse<SongLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("song_library")
				.insert([
					{
						user_id: userId,
						song_id: req.song_id,
						song_owner_id: req.song_owner_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add song to library"),
			}),
	});
}

/**
 * Server-side handler for adding a song to user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into song_library using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @param request - The request body containing song_id and song_owner_id
 * @returns The inserted song library entry, or fails with an error
 */
export default function addSongToLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<SongLibrary, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addSongToLibraryGen($) {
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
		let req: AddSongRequest = { song_id: "", song_owner_id: "" };
		try {
			req = extractAddSongRequest(requestBody);
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

		// Insert into song_library using service key
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

		const libraryEntry: SongLibrary = {
			created_at: data.created_at,
			song_id: data.song_id,
			song_owner_id: data.song_owner_id,
			user_id: data.user_id,
		};

		return libraryEntry;
	});
}
