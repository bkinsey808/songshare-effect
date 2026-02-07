import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { PostgrestResponse } from "@/react/supabase/client/SupabaseClientLike";

import makeGetStub from "@/react/playlist/test-utils/makeGetStub";
import makePlaylistPrivate from "@/react/playlist/test-utils/makePlaylistPrivate";
import makePlaylistPublic from "@/react/playlist/test-utils/makePlaylistPublic";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic";
import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import createMinimalSupabaseClient from "@/react/supabase/test-utils/createMinimalSupabaseClient.mock";

import fetchPlaylist from "./fetchPlaylist";

vi.mock("@/react/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/supabase/client/getSupabaseClient");
vi.mock("@/react/supabase/client/safe-query/callSelect");

describe("fetchPlaylist error cases", () => {
	it("throws NoSupabaseClientError when no client is available", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const eff = fetchPlaylist("no-client", makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/No Supabase client available/);
	});

	it("throws PlaylistNotFoundError when public playlist not found", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		const emptyResp: PostgrestResponse = { data: [] };
		vi.mocked(callSelect).mockResolvedValue(emptyResp);

		const eff = fetchPlaylist("missing-slug", makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Playlist not found/);
	});
});

// Success and additional error cases
describe("fetchPlaylist success & behavior", () => {
	it("sets current playlist on success and merges private overrides", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());

		const pub = makePlaylistPublic();
		const priv = makePlaylistPrivate();
		const owner = makeUserPublic();

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] } as PostgrestResponse)
			.mockResolvedValueOnce({ data: [priv] } as PostgrestResponse)
			.mockResolvedValueOnce({ data: [owner] } as PostgrestResponse);

		const get = makeGetStub();
		const eff = fetchPlaylist("slug-1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		const state = get();
		expect(state.setCurrentPlaylist).toHaveBeenCalledWith(
			expect.objectContaining({
				playlist_id: "00000000-0000-0000-0000-000000000001",
				private_notes: "private note",
			}),
		);
		expect(state.setPlaylistLoading).toHaveBeenCalledWith(true);
		expect(state.setPlaylistLoading).toHaveBeenCalledWith(false);
	});

	it("throws InvalidPlaylistDataError when public data fails guard", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		// Return an invalid public row
		vi.mocked(callSelect).mockResolvedValueOnce({ data: [{}] } as PostgrestResponse);

		const get = makeGetStub();
		const eff = fetchPlaylist("bad-slug", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Invalid playlist_public data/);
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(true);
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
		expect(get().setPlaylistError).toHaveBeenCalledWith(expect.anything());
	});

	it("maps query failures to QueryError and sets error state", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(callSelect).mockRejectedValue(new Error("boom"));

		const get = makeGetStub();
		const eff = fetchPlaylist("any", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to query playlist_public/);
		expect(get().setPlaylistError).toHaveBeenCalledWith(expect.anything());
		expect(get().setPlaylistLoading).toHaveBeenCalledWith(false);
	});
});
