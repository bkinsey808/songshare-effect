import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityPlaylist, CommunityShareRequest, CommunitySong } from "../community-types";
import cloneCommunityRow from "./cloneCommunityRow";
import fetchOptionalPostgrestResponse from "./fetchOptionalPostgrestResponse";

const EMPTY_COUNT = 0;

type FetchCommunityShareRequestsOptions = {
	client: SupabaseClientLike<Database>;
	communityId: string;
	communitySongs: readonly CommunitySong[];
	communityPlaylists: readonly CommunityPlaylist[];
};

/**
 * Loads visible community share requests and enriches them with sender and
 * shared-item display names.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @param communitySongs - already enriched community songs
 * @param communityPlaylists - already enriched community playlists
 * @returns enriched community share requests
 */
export default async function fetchCommunityShareRequests(
	options: FetchCommunityShareRequestsOptions,
): Promise<CommunityShareRequest[]> {
	const { client, communityId, communitySongs, communityPlaylists } = options;
	const shareRequestsRes = await fetchOptionalPostgrestResponse(() =>
		callSelect<CommunityShareRequest>(client, "community_share_request", {
			cols: "*",
			eq: { col: "community_id", val: communityId },
		}),
	);

	const rawShareRequests = shareRequestsRes.data ?? [];
	const senderIds = rawShareRequests.map((request) => request.sender_user_id);
	let senderUsernameMap = new Map<string, string>();

	if (senderIds.length > EMPTY_COUNT) {
		const requestUsersRes = await fetchOptionalPostgrestResponse(() =>
			callSelect<{ user_id: string; username: string }>(client, "user_public", {
				cols: "user_id, username",
				in: { col: "user_id", vals: senderIds },
			}),
		);
		senderUsernameMap = new Map(
			(requestUsersRes.data ?? []).map((user) => [user.user_id, user.username]),
		);
	}

	const shareRequestNameMap = new Map<string, string>();
	for (const request of rawShareRequests) {
		if (request.shared_item_type === "song") {
			const song = communitySongs.find((entry) => entry.song_id === request.shared_item_id);
			if (song?.song_name !== undefined) {
				shareRequestNameMap.set(request.request_id, song.song_name);
			}
		}
		if (request.shared_item_type === "playlist") {
			const playlist = communityPlaylists.find(
				(entry) => entry.playlist_id === request.shared_item_id,
			);
			if (playlist?.playlist_name !== undefined) {
				shareRequestNameMap.set(request.request_id, playlist.playlist_name);
			}
		}
	}

	return rawShareRequests.map((request) => {
		const enrichedRequest = cloneCommunityRow(request);
		enrichedRequest.sender_username = senderUsernameMap.get(request.sender_user_id);
		enrichedRequest.shared_item_name = shareRequestNameMap.get(request.request_id);
		return enrichedRequest;
	});
}
