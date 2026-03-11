import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asNull from "@/react/lib/test-utils/asNull";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeGetStub from "@/react/playlist/slice/makeGetPlaylistSliceStub.mock";
import makePlaylistPublic from "@/react/playlist/test-utils/makePlaylistPublic";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

import fetchPlaylistById from "./fetchPlaylistById";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);
const PLAYLIST_ID = "00000000-0000-0000-0000-000000000001";

describe("fetchPlaylistById", () => {
	it("sets success and playlist data when public and owner queries succeed", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		const mockPlaylistPublic = makePlaylistPublic({ playlist_id: PLAYLIST_ID });
		const mockUserPublic = makeUserPublic();
		const get = makeGetStub();

		mockedCallSelect
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [mockPlaylistPublic], error: asNull() }),
			)
			.mockResolvedValueOnce(asPostgrestResponse({ data: [], error: asNull() }))
			.mockResolvedValueOnce(asPostgrestResponse({ data: [mockUserPublic], error: asNull() }));

		await Effect.runPromise(fetchPlaylistById(PLAYLIST_ID, get));

		expect(get().setCurrentPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({ public: mockPlaylistPublic }),
		);
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
	});

	it("queries playlist_public by playlist_id", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		const mockPlaylistPublic = makePlaylistPublic({ playlist_id: PLAYLIST_ID });
		const mockUserPublic = makeUserPublic();
		const get = makeGetStub();

		mockedCallSelect
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [mockPlaylistPublic], error: asNull() }),
			)
			.mockResolvedValueOnce(asPostgrestResponse({ data: [], error: asNull() }))
			.mockResolvedValueOnce(asPostgrestResponse({ data: [mockUserPublic], error: asNull() }));

		await Effect.runPromise(fetchPlaylistById(PLAYLIST_ID, get));

		const FIRST_CALL = 1;
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			FIRST_CALL,
			expect.anything(),
			"playlist_public",
			expect.objectContaining({ eq: { col: "playlist_id", val: PLAYLIST_ID } }),
		);
	});

	it("fails with PlaylistNotFoundError when public query returns empty", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse({ data: [], error: asNull() }));

		const get = makeGetStub();

		await expect(
			Effect.runPromise(fetchPlaylistById("nonexistent-id", get)),
		).rejects.toThrow(/Playlist not found: nonexistent-id/);
		expect(get().setPlaylistError).toHaveBeenCalledWith(
			expect.stringContaining("not found"),
		);
	});

	it("fails with NoSupabaseClientError when client is undefined", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(undefined);

		const get = makeGetStub();

		await expect(Effect.runPromise(fetchPlaylistById(PLAYLIST_ID, get))).rejects.toThrow(
			/No Supabase client/,
		);
	});
});
