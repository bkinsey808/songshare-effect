import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type SongLibrary } from "@/shared/generated/supabaseSchemas";

import type { AddSongRequest } from "./AddSongRequest.type";
import attemptSongLibraryRepair from "./attemptSongLibraryRepair";
import extractAddSongRequest from "./extractAddSongRequest";
import performSongLibraryInsert from "./performSongLibraryInsert";

/**
 * Server-side handler for adding a song to user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into song_library using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @param request - The request body containing song_id
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
		let req: AddSongRequest = { song_id: "" };
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

		// Fetch song owner from song_public before inserting
		const songPublicResult = yield* $(
			Effect.tryPromise({
				try: () => client.from("song_public").select("user_id").eq("song_id", req.song_id).single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch song"),
					}),
			}),
		);

		const songOwnerId: string | undefined = songPublicResult.data?.user_id ?? undefined;

		// Insert into song_library using service key
		const insertResult = yield* $(performSongLibraryInsert(client, userId, req));

		const { data, error: insertError } = insertResult;

		if (insertError !== undefined && insertError !== null) {
			const errorMsg = extractErrorMessage(insertError, "Unknown error");
			const isSongFkViolation =
				typeof errorMsg === "string" && errorMsg.includes("song_library_song_id_fkey");
			if (isSongFkViolation) {
				const repaired = yield* $(attemptSongLibraryRepair(client, userId, { req, songOwnerId }));
				if (repaired !== undefined) {
					return repaired;
				}
			}
			console.error("[addSongToLibrary] Insert failed:", errorMsg, {
				song_id: req.song_id,
				user_id: userId,
			});
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

		const libraryEntry: SongLibrary & { song_owner_id?: string } = {
			created_at: data.created_at,
			song_id: data.song_id,
			user_id: data.user_id,
			...(songOwnerId === undefined ? {} : { song_owner_id: songOwnerId }),
		};

		return libraryEntry;
	});
}
