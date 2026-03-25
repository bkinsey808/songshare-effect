import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type PlaylistLibrary } from "@/shared/generated/supabaseSchemas";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import type { AddPlaylistRequest } from "./AddPlaylistRequest.type";
import addPlaylistSongsToUserLibrary from "./addPlaylistSongsToUserLibrary";
import extractAddPlaylistRequest from "./extractAddPlaylistRequest";
import performPlaylistLibraryInsert, {
	type PlaylistLibraryRow,
} from "./performPlaylistLibraryInsert";

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
		let req: AddPlaylistRequest = { playlist_id: "" };
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

		// Fetch playlist owner from playlist_public before inserting
		const playlistPublicResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("playlist_public")
						.select("user_id")
						.eq("playlist_id", req.playlist_id)
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch playlist"),
					}),
			}),
		);

		const playlistOwnerId: string | undefined = playlistPublicResult.data?.user_id ?? undefined;

		// Insert into playlist_library using service key
		const insertResult = yield* $(
			performPlaylistLibraryInsert(client, userId, req).pipe(
				Effect.catchAll((dbError) =>
					// When insert throws (e.g. duplicate key), convert to result for handling
					Effect.succeed({
						// oxlint-disable-next-line unicorn/no-null -- DB error shape uses null for absent data
						data: null,
						error: dbError,
					} as { data: PlaylistLibraryRow | null; error: unknown }),
				),
			),
		);

		const { data, error: insertError } = insertResult;

		if (insertError !== null) {
			const errorMsg = extractErrorMessage(insertError, "Unknown error");
			// Duplicate key = already in library; treat as idempotent success
			const isDuplicate =
				typeof errorMsg === "string" &&
				(errorMsg.includes("playlist_library_pkey") || errorMsg.includes("duplicate key"));
			if (isDuplicate) {
				const existingResult = yield* $(
					Effect.tryPromise({
						try: () =>
							client
								.from("playlist_library")
								.select("*")
								.eq("user_id", userId)
								.eq("playlist_id", req.playlist_id)
								.single(),
						catch: () =>
							new DatabaseError({
								message: "Failed to fetch existing library entry",
							}),
					}).pipe(
						Effect.map((res) => res.data),
						// oxlint-disable-next-line unicorn/no-null -- fetch failed, no data
						Effect.catchAll(() => Effect.succeed(null)),
					),
				);
				if (existingResult !== null) {
					return {
						created_at: existingResult.created_at,
						playlist_id: existingResult.playlist_id,
						user_id: existingResult.user_id,
						...(playlistOwnerId === undefined ? {} : { playlist_owner_id: playlistOwnerId }),
					};
				}
				// Fetch failed; return synthetic success so client does not show error
				return {
					created_at: new Date().toISOString(),
					playlist_id: req.playlist_id,
					user_id: userId,
					...(playlistOwnerId === undefined ? {} : { playlist_owner_id: playlistOwnerId }),
				};
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: errorMsg,
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

		const libraryEntry: PlaylistLibrary & { playlist_owner_id?: string } = {
			created_at: data.created_at,
			playlist_id: data.playlist_id,
			user_id: data.user_id,
			...(playlistOwnerId === undefined ? {} : { playlist_owner_id: playlistOwnerId }),
		};

		return libraryEntry;
	});
}
