import { Effect } from "effect";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunitySong } from "../community-types";
import cloneCommunityRow from "./cloneCommunityRow";

const EMPTY_COUNT = 0;

/**
 * Loads community songs and enriches them with public song metadata.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @returns effect that yields enriched community songs
 */
export default function fetchCommunitySongs(
	client: SupabaseClientLike<Database>,
	communityId: string,
): Effect.Effect<CommunitySong[], Error> {
	return Effect.gen(function* fetchCommunitySongsGen($) {
		const songsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<CommunitySong>(client, "community_song", {
						cols: "*",
						eq: { col: "community_id", val: communityId },
					}),
				catch: (err) =>
					new Error(`Failed to fetch songs: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const rawSongsData: CommunitySong[] = songsRes.data ?? [];
		const songIds = rawSongsData.map((song) => song.song_id);
		if (songIds.length === EMPTY_COUNT) {
			return [];
		}

		const songDetailsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<{ song_id: string; song_name: string; song_slug: string }>(
						client,
						"song_public",
						{
							cols: "song_id, song_name, song_slug",
							in: { col: "song_id", vals: songIds },
						},
					),
				catch: (err) =>
					new Error(`Failed to fetch song details: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const songDetailMap = new Map(
			(songDetailsRes.data ?? []).map((details) => [details.song_id, details]),
		);

		return rawSongsData.map((communitySong) => {
			const enrichedSong = cloneCommunityRow(communitySong);
			enrichedSong.song_name = songDetailMap.get(communitySong.song_id)?.song_name;
			enrichedSong.song_slug = songDetailMap.get(communitySong.song_id)?.song_slug;
			return enrichedSong;
		});
	});
}
