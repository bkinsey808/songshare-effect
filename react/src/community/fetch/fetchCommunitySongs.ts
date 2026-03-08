import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunitySong } from "../community-types";

import cloneCommunityRow from "./cloneCommunityRow";
import fetchOptionalPostgrestResponse from "./fetchOptionalPostgrestResponse";

const EMPTY_COUNT = 0;

/**
 * Loads community songs and enriches them with public song metadata.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @returns enriched community songs
 */
export default async function fetchCommunitySongs(
	client: SupabaseClientLike<Database>,
	communityId: string,
): Promise<CommunitySong[]> {
	const songsRes = await fetchOptionalPostgrestResponse(() =>
		callSelect<CommunitySong>(client, "community_song", {
			cols: "*",
			eq: { col: "community_id", val: communityId },
		}),
	);

	const rawSongsData: CommunitySong[] = songsRes.data ?? [];
	const songIds = rawSongsData.map((song) => song.song_id);
	if (songIds.length === EMPTY_COUNT) {
		return [];
	}

	const songDetailsRes = await fetchOptionalPostgrestResponse(() =>
		callSelect<{ song_id: string; song_name: string; song_slug: string }>(client, "song_public", {
			cols: "song_id, song_name, song_slug",
			in: { col: "song_id", vals: songIds },
		}),
	);

	const songDetailMap = new Map((songDetailsRes.data ?? []).map((details) => [details.song_id, details]));

	return rawSongsData.map((communitySong) => {
		const enrichedSong = cloneCommunityRow(communitySong);
		enrichedSong.song_name = songDetailMap.get(communitySong.song_id)?.song_name;
		enrichedSong.song_slug = songDetailMap.get(communitySong.song_id)?.song_slug;
		return enrichedSong;
	});
}
