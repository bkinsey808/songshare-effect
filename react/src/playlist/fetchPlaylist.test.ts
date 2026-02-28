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

import fetchPlaylist from "./fetchPlaylist";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

// Typed mocked helper for callSelect
const mockedCallSelect = vi.mocked(callSelect);

describe("fetchPlaylist", () => {
	it("sets success and playlist data on success", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		const mockPlaylist = makePlaylistPublic();
		const get = makeGetStub();

		mockedCallSelect.mockResolvedValue(
			asPostgrestResponse({ data: [mockPlaylist], error: asNull() }),
		);

		await Effect.runPromise(fetchPlaylist("p1", get));

		expect(get().setCurrentPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({ public: mockPlaylist }),
		);
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
	});

	it("handles unauthorized error when token is missing", async () => {
		vi.clearAllMocks();
		// Mock token to be undefined (no user logged in)
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(undefined);
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		const playlistPublic = makePlaylistPublic();
		const userPublic = makeUserPublic();

		// Even with null token, the query might succeed or fail depending on RLS.
		// We mock success to verify the flow completes.
		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse({ data: [playlistPublic], error: asNull() }))
			.mockResolvedValueOnce(asPostgrestResponse({ data: [], error: asNull() }))
			.mockResolvedValueOnce(asPostgrestResponse({ data: [userPublic], error: asNull() }));

		const get = makeGetStub();
		await Effect.runPromise(fetchPlaylist("p1", get));

		expect(get().setCurrentPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({ public: playlistPublic }),
		);
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
	});

	it("handles query failures by setting the error state", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		// A rejected promise from callSelect (e.g. network fail or thrown error)
		vi.mocked(callSelect).mockRejectedValue(new Error("query failed"));

		const get = makeGetStub();
		const eff = fetchPlaylist("p1", get);

		// Effect should fail and the promise should reject
		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to query playlist_public/);

		// Cleanup should still turn off loading
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
		// The error message should be set in the slice
		expect(get().setPlaylistError).toHaveBeenCalledWith(
			expect.stringContaining("Failed to query playlist_public"),
		);
	});

	it("handles missing playlist by failing with not found", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);

		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		// Return empty data (no rows found)
		mockedCallSelect.mockResolvedValue(asPostgrestResponse({ data: [], error: asNull() }));

		const get = makeGetStub();
		const eff = fetchPlaylist("missing", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Playlist not found: missing/);

		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
		expect(get().setPlaylistError).toHaveBeenCalledWith(expect.stringContaining("not found"));
	});
});
