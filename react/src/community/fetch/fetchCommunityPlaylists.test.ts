import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityPlaylist } from "../community-types";
import fetchCommunityPlaylists from "./fetchCommunityPlaylists";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

const ONE_CALL = 1;
const TWO_CALLS = 2;
const SECOND_CALL = 2;
const EXPECTED_TWO_PLAYLISTS = 2;
const EXPECTED_ONE_PLAYLIST = 1;

describe("fetchCommunityPlaylists", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("returns empty array when community has no playlists", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse<CommunityPlaylist[]>({ data: [] }));

		const result = await Effect.runPromise(fetchCommunityPlaylists(fakeClient, "community-1"));

		expect(result).toStrictEqual([]);
		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockedCallSelect).toHaveBeenCalledWith(
			fakeClient,
			"community_playlist",
			expect.objectContaining({ eq: { col: "community_id", val: "community-1" } }),
		);
	});

	it("returns enriched playlists with playlist_name and playlist_slug", async () => {
		vi.resetAllMocks();
		const communityPlaylists: CommunityPlaylist[] = [
			{
				community_id: "community-1",
				playlist_id: "playlist-1",
				created_at: "2024-01-01",
			},
			{
				community_id: "community-1",
				playlist_id: "playlist-2",
				created_at: "2024-01-02",
			},
		];

		const playlistDetails = [
			{
				playlist_id: "playlist-1",
				playlist_name: "Playlist One",
				playlist_slug: "playlist-one",
			},
			{
				playlist_id: "playlist-2",
				playlist_name: "Playlist Two",
				playlist_slug: "playlist-two",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityPlaylist[]>({ data: communityPlaylists }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{
					playlist_id: string;
					playlist_name: string;
					playlist_slug: string;
				}>({
					data: playlistDetails,
				}),
			);

		const result = await Effect.runPromise(fetchCommunityPlaylists(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_TWO_PLAYLISTS);
		const [firstPlaylist, secondPlaylist] = result;
		expect(firstPlaylist).toMatchObject({
			community_id: "community-1",
			playlist_id: "playlist-1",
			playlist_name: "Playlist One",
			playlist_slug: "playlist-one",
		});
		expect(secondPlaylist).toMatchObject({
			community_id: "community-1",
			playlist_id: "playlist-2",
			playlist_name: "Playlist Two",
			playlist_slug: "playlist-two",
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(TWO_CALLS);
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			SECOND_CALL,
			fakeClient,
			"playlist_public",
			expect.objectContaining({
				cols: "playlist_id, playlist_name, playlist_slug",
				in: { col: "playlist_id", vals: ["playlist-1", "playlist-2"] },
			}),
		);
	});

	it("leaves playlist_name and playlist_slug undefined when details are missing", async () => {
		vi.resetAllMocks();
		const communityPlaylists: CommunityPlaylist[] = [
			{
				community_id: "community-1",
				playlist_id: "playlist-1",
				created_at: "2024-01-01",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityPlaylist[]>({ data: communityPlaylists }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{
					playlist_id: string;
					playlist_name: string;
					playlist_slug: string;
				}>({
					data: [],
				}),
			);

		const result = await Effect.runPromise(fetchCommunityPlaylists(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_ONE_PLAYLIST);
		const [firstPlaylist] = result;
		expect(firstPlaylist).toMatchObject({
			community_id: "community-1",
			playlist_id: "playlist-1",
		});
		expect(firstPlaylist?.playlist_name).toBeUndefined();
		expect(firstPlaylist?.playlist_slug).toBeUndefined();
	});
});
