import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type SongLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import type { AddSongRequest } from "./AddSongRequest.type";
import performSongLibraryInsert from "./performSongLibraryInsert";

type SongLibraryRow = Database["public"]["Tables"]["song_library"]["Row"];
type SongInsertFallback = { data: undefined; error: { message: string } };

/**
 * On song_library FK violation (song_id missing from song), insert the song row
 * and retry. Uses song_owner_id from the request as song.user_id. Returns the
 * library entry on success, undefined otherwise.
 */
export default function attemptSongLibraryRepair(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddSongRequest,
): Effect.Effect<SongLibrary | undefined> {
	return Effect.gen(function* repair($) {
		const insertSongRes = yield* $(
			Effect.promise(() =>
				client.from("song").insert([
					{
						song_id: req.song_id,
						user_id: req.song_owner_id,
						private_notes: "",
					},
				]),
			).pipe(
				Effect.catchAll(() =>
					Effect.succeed({
						data: undefined,
						error: { message: "insert failed" },
					} satisfies SongInsertFallback),
				),
			),
		);
		if (insertSongRes.error !== undefined && insertSongRes.error !== null) {
			return undefined;
		}
		const retryEither = yield* $(Effect.either(performSongLibraryInsert(client, userId, req)));
		if (retryEither._tag === "Left") {
			return undefined;
		}
		const retryResult: PostgrestSingleResponse<SongLibraryRow> = retryEither.right;
		const { data: retryData, error: retryError } = retryResult;
		if (retryError !== undefined && retryError !== null) {
			return undefined;
		}
		const data = retryData ?? undefined;
		if (data === undefined) {
			return undefined;
		}
		return {
			created_at: data.created_at,
			song_id: data.song_id,
			song_owner_id: data.song_owner_id,
			user_id: data.user_id,
		};
	});
}
