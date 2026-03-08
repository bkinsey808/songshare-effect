import { Effect } from "effect";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityPlaylist } from "../community-types";
import cloneCommunityRow from "./cloneCommunityRow";

const EMPTY_COUNT = 0;

/**
 * Loads community playlists and enriches them with public playlist metadata.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @returns effect that yields enriched community playlists
 */
export default function fetchCommunityPlaylists(
	client: SupabaseClientLike<Database>,
	communityId: string,
): Effect.Effect<CommunityPlaylist[], Error> {
	return Effect.gen(function* fetchCommunityPlaylistsGen($) {
		const playlistsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<CommunityPlaylist>(client, "community_playlist", {
						cols: "*",
						eq: { col: "community_id", val: communityId },
					}),
				catch: (err) =>
					new Error(`Failed to fetch playlists: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const rawPlaylistsData: CommunityPlaylist[] = playlistsRes.data ?? [];
		const playlistIds = rawPlaylistsData.map((playlist) => playlist.playlist_id);
		if (playlistIds.length === EMPTY_COUNT) {
			return [];
		}

		const playlistDetailsRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<{
						playlist_id: string;
						playlist_name: string;
						playlist_slug: string;
					}>(client, "playlist_public", {
						cols: "playlist_id, playlist_name, playlist_slug",
						in: { col: "playlist_id", vals: playlistIds },
					}),
				catch: (err) =>
					new Error(
						`Failed to fetch playlist details: ${extractErrorMessage(err, "Unknown error")}`,
					),
			}),
		);

		const playlistDetailMap = new Map(
			(playlistDetailsRes.data ?? []).map((details) => [details.playlist_id, details]),
		);

		return rawPlaylistsData.map((communityPlaylist) => {
			const enrichedPlaylist = cloneCommunityRow(communityPlaylist);
			enrichedPlaylist.playlist_name = playlistDetailMap.get(
				communityPlaylist.playlist_id,
			)?.playlist_name;
			enrichedPlaylist.playlist_slug = playlistDetailMap.get(
				communityPlaylist.playlist_id,
			)?.playlist_slug;
			return enrichedPlaylist;
		});
	});
}
