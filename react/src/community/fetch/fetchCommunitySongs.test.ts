import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunitySong } from "../community-types";
import fetchCommunitySongs from "./fetchCommunitySongs";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

const ONE_CALL = 1;
const TWO_CALLS = 2;
const SECOND_CALL = 2;
const EXPECTED_TWO_SONGS = 2;
const EXPECTED_ONE_SONG = 1;

describe("fetchCommunitySongs", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("returns empty array when community has no songs", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse<CommunitySong[]>({ data: [] }));

		const result = await Effect.runPromise(fetchCommunitySongs(fakeClient, "community-1"));

		expect(result).toStrictEqual([]);
		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockedCallSelect).toHaveBeenCalledWith(
			fakeClient,
			"community_song",
			expect.objectContaining({ eq: { col: "community_id", val: "community-1" } }),
		);
	});

	it("returns enriched songs with song_name and song_slug", async () => {
		vi.resetAllMocks();
		const communitySongs: CommunitySong[] = [
			{
				community_id: "community-1",
				song_id: "song-1",
				created_at: "2024-01-01",
			},
			{
				community_id: "community-1",
				song_id: "song-2",
				created_at: "2024-01-02",
			},
		];

		const songDetails = [
			{ song_id: "song-1", song_name: "Song One", song_slug: "song-one" },
			{ song_id: "song-2", song_name: "Song Two", song_slug: "song-two" },
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunitySong[]>({ data: communitySongs }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ song_id: string; song_name: string; song_slug: string }>({
					data: songDetails,
				}),
			);

		const result = await Effect.runPromise(fetchCommunitySongs(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_TWO_SONGS);
		const [firstSong, secondSong] = result;
		expect(firstSong).toMatchObject({
			community_id: "community-1",
			song_id: "song-1",
			song_name: "Song One",
			song_slug: "song-one",
		});
		expect(secondSong).toMatchObject({
			community_id: "community-1",
			song_id: "song-2",
			song_name: "Song Two",
			song_slug: "song-two",
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(TWO_CALLS);
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			SECOND_CALL,
			fakeClient,
			"song_public",
			expect.objectContaining({
				cols: "song_id, song_name, song_slug",
				in: { col: "song_id", vals: ["song-1", "song-2"] },
			}),
		);
	});

	it("leaves song_name and song_slug undefined when details are missing", async () => {
		vi.resetAllMocks();
		const communitySongs: CommunitySong[] = [
			{
				community_id: "community-1",
				song_id: "song-1",
				created_at: "2024-01-01",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunitySong[]>({ data: communitySongs }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ song_id: string; song_name: string; song_slug: string }>({
					data: [],
				}),
			);

		const result = await Effect.runPromise(fetchCommunitySongs(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_ONE_SONG);
		const [firstSong] = result;
		expect(firstSong).toMatchObject({
			community_id: "community-1",
			song_id: "song-1",
		});
		expect(firstSong?.song_name).toBeUndefined();
		expect(firstSong?.song_slug).toBeUndefined();
	});
});
