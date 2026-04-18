import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type SongLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import type { AddSongRequest } from "./AddSongRequest.type";
import performSongLibraryInsert from "./performSongLibraryInsert";

type SongLibraryRow = Database["public"]["Tables"]["song_library"]["Row"];
type SongInsertFallback = { data: undefined; error: { message: string } };

type RepairOptions = {
	req: AddSongRequest;
	songOwnerId: string | undefined;
};

/**
 * On song_library FK violation (song_id missing from song), insert the song row
 * and retry. Uses songOwnerId as song.user_id. Returns the
 * library entry on success, undefined otherwise.
 * @param client - Supabase client.
 * @param userId - ID of the user whose library is being updated.
 * @param req - The add-song request that triggered the repair.
 * @param songOwnerId - Optional owner id to use when inserting the missing song row.
 * @returns An Effect that succeeds with the SongLibrary entry or undefined if repair fails.
 */
export default function attemptSongLibraryRepair(
	client: SupabaseClient<Database>,
	userId: string,
	options: RepairOptions,
): Effect.Effect<(SongLibrary & { song_owner_id?: string }) | undefined> {
	const { req, songOwnerId } = options;
	return Effect.gen(function* repair($) {
		if (songOwnerId === undefined) {
			return undefined;
		}
		const insertSongRes = yield* $(
			Effect.promise(() =>
				client.from("song").insert([
					{
						song_id: req.song_id,
						user_id: songOwnerId,
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
			user_id: data.user_id,
			...(songOwnerId === undefined ? {} : { song_owner_id: songOwnerId }),
		};
	});
}
