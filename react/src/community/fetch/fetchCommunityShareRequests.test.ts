import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityPlaylist, CommunityShareRequest, CommunitySong } from "../community-types";
import fetchCommunityShareRequests from "./fetchCommunityShareRequests";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

const ONE_CALL = 1;
const TWO_CALLS = 2;
const SECOND_CALL = 2;
const EXPECTED_ONE_REQUEST = 1;
const EXPECTED_TWO_REQUESTS = 2;

describe("fetchCommunityShareRequests", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	const communitySong: CommunitySong = {
		community_id: "community-1",
		song_id: "song-1",
		created_at: "2024-01-01",
		song_name: "My Song",
		song_slug: "my-song",
	};

	const communityPlaylist: CommunityPlaylist = {
		community_id: "community-1",
		playlist_id: "playlist-1",
		created_at: "2024-01-01",
		playlist_name: "My Playlist",
		playlist_slug: "my-playlist",
	};

	it("returns empty array when community has no share requests", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(
			asPostgrestResponse<CommunityShareRequest[]>({ data: [] }),
		);

		const result = await fetchCommunityShareRequests({
			client: fakeClient,
			communityId: "community-1",
			communitySongs: [],
			communityPlaylists: [],
		});

		expect(result).toStrictEqual([]);
		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockedCallSelect).toHaveBeenCalledWith(
			fakeClient,
			"community_share_request",
			expect.objectContaining({ eq: { col: "community_id", val: "community-1" } }),
		);
	});

	it("skips user fetch when share requests is empty", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(
			asPostgrestResponse<CommunityShareRequest[]>({ data: [] }),
		);

		await fetchCommunityShareRequests({
			client: fakeClient,
			communityId: "community-1",
			communitySongs: [],
			communityPlaylists: [],
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("enriches share requests with sender_username and shared_item_name", async () => {
		vi.resetAllMocks();
		const shareRequests: CommunityShareRequest[] = [
			{
				request_id: "req-1",
				community_id: "community-1",
				sender_user_id: "user-1",
				shared_item_type: "song",
				shared_item_id: "song-1",
				status: "pending",
				created_at: "2024-01-01",
				updated_at: "2024-01-01",
			},
			{
				request_id: "req-2",
				community_id: "community-1",
				sender_user_id: "user-1",
				shared_item_type: "playlist",
				shared_item_id: "playlist-1",
				status: "pending",
				created_at: "2024-01-02",
				updated_at: "2024-01-02",
			},
		];

		const users = [{ user_id: "user-1", username: "alice" }];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityShareRequest[]>({ data: shareRequests }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ user_id: string; username: string }>({
					data: users,
				}),
			);

		const result = await fetchCommunityShareRequests({
			client: fakeClient,
			communityId: "community-1",
			communitySongs: [communitySong],
			communityPlaylists: [communityPlaylist],
		});

		expect(result).toHaveLength(EXPECTED_TWO_REQUESTS);
		const [firstRequest, secondRequest] = result;
		expect(firstRequest).toMatchObject({
			request_id: "req-1",
			sender_username: "alice",
			shared_item_name: "My Song",
		});
		expect(secondRequest).toMatchObject({
			request_id: "req-2",
			sender_username: "alice",
			shared_item_name: "My Playlist",
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(TWO_CALLS);
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			SECOND_CALL,
			fakeClient,
			"user_public",
			expect.objectContaining({
				cols: "user_id, username",
				in: { col: "user_id", vals: ["user-1", "user-1"] },
			}),
		);
	});

	it("leaves shared_item_name undefined when song or playlist not in libraries", async () => {
		vi.resetAllMocks();
		const shareRequests: CommunityShareRequest[] = [
			{
				request_id: "req-1",
				community_id: "community-1",
				sender_user_id: "user-1",
				shared_item_type: "song",
				shared_item_id: "unknown-song",
				status: "pending",
				created_at: "2024-01-01",
				updated_at: "2024-01-01",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityShareRequest[]>({ data: shareRequests }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ user_id: string; username: string }>({
					data: [{ user_id: "user-1", username: "alice" }],
				}),
			);

		const result = await fetchCommunityShareRequests({
			client: fakeClient,
			communityId: "community-1",
			communitySongs: [communitySong],
			communityPlaylists: [communityPlaylist],
		});

		expect(result).toHaveLength(EXPECTED_ONE_REQUEST);
		const [firstRequest] = result;
		expect(firstRequest?.sender_username).toBe("alice");
		expect(firstRequest?.shared_item_name).toBeUndefined();
	});
});
