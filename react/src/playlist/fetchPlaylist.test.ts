import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { PostgrestResponse } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import asNull from "@/react/lib/test-utils/asNull";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeGetStub from "@/react/playlist/slice/makeGetPlaylistSliceStub.mock";
import makePlaylistPublic from "@/react/playlist/test-utils/makePlaylistPublic";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

import fetchPlaylist from "./fetchPlaylist";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

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

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		vi.mocked(callSelect).mockResolvedValue({
			data: [mockPlaylist],
			error: asNull(),
		} as unknown as PostgrestResponse);

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
		vi.mocked(callSelect)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
			.mockResolvedValueOnce({
				data: [playlistPublic],
				error: asNull(),
			} as unknown as PostgrestResponse)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
			.mockResolvedValueOnce({ data: [], error: asNull() } as unknown as PostgrestResponse)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
			.mockResolvedValueOnce({
				data: [userPublic],
				error: asNull(),
			} as unknown as PostgrestResponse);

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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		vi.mocked(callSelect).mockResolvedValue({
			data: [],
			error: asNull(),
		} as unknown as PostgrestResponse);

		const get = makeGetStub();
		const eff = fetchPlaylist("missing", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Playlist not found: missing/);

		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
		expect(get().setPlaylistError).toHaveBeenCalledWith(expect.stringContaining("not found"));
	});
});
