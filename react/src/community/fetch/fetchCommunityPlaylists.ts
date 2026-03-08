import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityPlaylist } from "../community-types";

import cloneCommunityRow from "./cloneCommunityRow";
import fetchOptionalPostgrestResponse from "./fetchOptionalPostgrestResponse";

const EMPTY_COUNT = 0;

/**
 * Loads community playlists and enriches them with public playlist metadata.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @returns enriched community playlists
 */
export default async function fetchCommunityPlaylists(
	client: SupabaseClientLike<Database>,
	communityId: string,
): Promise<CommunityPlaylist[]> {
	const playlistsRes = await fetchOptionalPostgrestResponse(() =>
		callSelect<CommunityPlaylist>(client, "community_playlist", {
			cols: "*",
			eq: { col: "community_id", val: communityId },
		}),
	);

	const rawPlaylistsData: CommunityPlaylist[] = playlistsRes.data ?? [];
	const playlistIds = rawPlaylistsData.map((playlist) => playlist.playlist_id);
	if (playlistIds.length === EMPTY_COUNT) {
		return [];
	}

	const playlistDetailsRes = await fetchOptionalPostgrestResponse(() =>
		callSelect<{ playlist_id: string; playlist_name: string; playlist_slug: string }>(
			client,
			"playlist_public",
			{
				cols: "playlist_id, playlist_name, playlist_slug",
				in: { col: "playlist_id", vals: playlistIds },
			},
		),
	);

	const playlistDetailMap = new Map(
		(playlistDetailsRes.data ?? []).map((details) => [details.playlist_id, details]),
	);

	return rawPlaylistsData.map((communityPlaylist) => {
		const enrichedPlaylist = cloneCommunityRow(communityPlaylist);
		enrichedPlaylist.playlist_name =
			playlistDetailMap.get(communityPlaylist.playlist_id)?.playlist_name;
		enrichedPlaylist.playlist_slug =
			playlistDetailMap.get(communityPlaylist.playlist_id)?.playlist_slug;
		return enrichedPlaylist;
	});
}
