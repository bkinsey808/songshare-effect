import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type PlaylistLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

const ARRAY_EMPTY = 0;

type AddPlaylistRequest = {
	playlist_id: string;
	playlist_owner_id: string;
};

type PlaylistLibraryRow = Database["public"]["Tables"]["playlist_library"]["Row"];

/**
 * Extract and validate the request payload for adding a playlist to a user's
 * library.
 *
 * @param request - The parsed request body; expected to be an object
 *   containing `playlist_id` and `playlist_owner_id` strings.
 * @returns - A validated `AddPlaylistRequest` containing `playlist_id` and
 *   `playlist_owner_id`.
 * @throws - `TypeError` when the request is not an object or when
 *   `playlist_id`/`playlist_owner_id` are missing or not strings.
 */
function extractAddPlaylistRequest(request: unknown): AddPlaylistRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("playlist_id" in request) || !("playlist_owner_id" in request)) {
		throw new TypeError("Request must contain playlist_id and playlist_owner_id");
	}

	const { playlist_id, playlist_owner_id } = request as Record<string, unknown>;

	if (typeof playlist_id !== "string" || typeof playlist_owner_id !== "string") {
		throw new TypeError("playlist_id and playlist_owner_id must be strings");
	}

	return { playlist_id, playlist_owner_id };
}

/**
 * Perform the Supabase insert for playlist_library.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing playlist_id and playlist_owner_id
 * @returns Insert result or error
 */
function performPlaylistLibraryInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddPlaylistRequest,
): Effect.Effect<PostgrestSingleResponse<PlaylistLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("playlist_library")
				.insert([
					{
						user_id: userId,
						playlist_id: req.playlist_id,
						playlist_owner_id: req.playlist_owner_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add playlist to library"),
			}),
	});
}

/**
 * Add songs from a playlist to the user's song library.
 * This is called when a user adds another user's playlist to their library.
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param playlistId - Playlist ID to get songs from
 */
function addPlaylistSongsToUserLibrary(
	client: SupabaseClient<Database>,
	userId: string,
	playlistId: string,
): Effect.Effect<void, DatabaseError> {
	return Effect.gen(function* addSongsGen($) {
		// Get the playlist's song_order
		const playlistResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("playlist_public")
						.select("song_order, user_id")
						.eq("playlist_id", playlistId)
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch playlist songs"),
					}),
			}),
		);

		if (playlistResult.error !== null || playlistResult.data === null) {
			console.warn(
				"[addPlaylistSongsToUserLibrary] Could not fetch playlist:",
				playlistResult.error?.message,
			);
			return;
		}

		const songIds = playlistResult.data.song_order ?? [];
		if (songIds.length === ARRAY_EMPTY) {
			return;
		}

		// Get song owner info for each song
		const songsResult = yield* $(
			Effect.tryPromise({
				try: () => client.from("song_public").select("song_id, user_id").in("song_id", songIds),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch song info"),
					}),
			}),
		);

		if (songsResult.error !== null || songsResult.data === null) {
			console.warn(
				"[addPlaylistSongsToUserLibrary] Could not fetch songs:",
				songsResult.error?.message,
			);
			return;
		}

		// Get user's existing song library to avoid duplicates
		const existingLibraryResult = yield* $(
			Effect.tryPromise({
				try: () => client.from("song_library").select("song_id").eq("user_id", userId),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch user library"),
					}),
			}),
		);

		const existingSongIds = new Set(
			(existingLibraryResult.data ?? []).map((entry) => entry.song_id),
		);

		// Filter out songs already in library
		const songsToAdd = songsResult.data.filter((song) => !existingSongIds.has(song.song_id));

		if (songsToAdd.length === ARRAY_EMPTY) {
			console.warn("[addPlaylistSongsToUserLibrary] All songs already in library");
			return;
		}

		// Insert songs into user's library
		const libraryEntries = songsToAdd.map((song) => ({
			user_id: userId,
			song_id: song.song_id,
			song_owner_id: song.user_id,
		}));

		yield* $(
			Effect.tryPromise({
				try: () => client.from("song_library").insert(libraryEntries),
				catch: (error) => {
					// Non-fatal: log but don't fail the whole operation
					console.warn(
						`[addPlaylistSongsToUserLibrary] Failed to add songs to library: ${extractErrorMessage(error, "Failed to add songs to library")}`,
					);
					return new DatabaseError({
						message: extractErrorMessage(error, "Failed to add songs to library"),
					});
				},
			}),
		);

		console.warn(
			`[addPlaylistSongsToUserLibrary] Added ${songsToAdd.length} songs to user library`,
		);
	});
}

/**
 * Server-side handler for adding a playlist to user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into playlist_library using service key (bypass RLS)
 * - also adds all songs from the playlist to the user's song library
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The inserted playlist library entry, or fails with an error
 */
export default function addPlaylistToLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<PlaylistLibrary, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addPlaylistToLibraryGen($) {
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
		let req: AddPlaylistRequest = { playlist_id: "", playlist_owner_id: "" };
		try {
			req = extractAddPlaylistRequest(requestBody);
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

		// Insert into playlist_library using service key
		const insertResult = yield* $(performPlaylistLibraryInsert(client, userId, req));

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

		// Also add all songs from the playlist to the user's song library
		// This is done after the playlist is added so we don't leave partial state
		yield* $(addPlaylistSongsToUserLibrary(client, userId, req.playlist_id));

		const libraryEntry: PlaylistLibrary = {
			created_at: data.created_at,
			playlist_id: data.playlist_id,
			playlist_owner_id: data.playlist_owner_id,
			user_id: data.user_id,
		};

		return libraryEntry;
	});
}
