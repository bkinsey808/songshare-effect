import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asNull from "@/react/lib/test-utils/asNull";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { PlaylistLibrarySlice } from "./PlaylistLibrarySlice.type";
import fetchPlaylistLibrary from "./fetchPlaylistLibrary";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

function makePlaylistLibraryGet(): () => PlaylistLibrarySlice {
	const setPlaylistLibraryEntries = vi.fn();
	const setPlaylistLibraryLoading = vi.fn();
	const setPlaylistLibraryError = vi.fn();
	const stub = forceCast<PlaylistLibrarySlice>({
		setPlaylistLibraryEntries,
		setPlaylistLibraryLoading,
		setPlaylistLibraryError,
	});
	return () => stub;
}

const LIBRARY_ROW = {
	user_id: "u1",
	playlist_id: "p1",
	playlist_owner_id: "o1",
};

const PLAYLIST_PUBLIC_ROW = {
	playlist_id: "p1",
	playlist_name: "My Playlist",
	playlist_slug: "my-playlist",
};

const USER_PUBLIC_ROW = {
	user_id: "o1",
	username: "owner1",
};

describe("fetchPlaylistLibrary", () => {
	it("fetches library entries and populates slice", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		clientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		mockedCallSelect
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [LIBRARY_ROW], error: asNull() }),
			)
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [PLAYLIST_PUBLIC_ROW], error: asNull() }),
			)
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [USER_PUBLIC_ROW], error: asNull() }),
			);

		const get = makePlaylistLibraryGet();

		await Effect.runPromise(fetchPlaylistLibrary(get));

		const { setPlaylistLibraryEntries, setPlaylistLibraryLoading } = get();
		expect(setPlaylistLibraryEntries).toHaveBeenCalledWith(expect.any(Object));
		const callIndex = 0;
		const argIndex = 0;
		const firstArg = vi.mocked(setPlaylistLibraryEntries).mock.calls[callIndex]?.[argIndex];
		expect(firstArg).toBeDefined();
		expect(firstArg).toMatchObject({
			p1: {
				playlist_id: "p1",
				playlist_name: "My Playlist",
				playlist_slug: "my-playlist",
				owner_username: "owner1",
			},
		});
		expect(setPlaylistLibraryLoading).toHaveBeenCalledWith(false);
	});

	it("fails when no Supabase client available", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		clientSpy.mockReturnValue?.(undefined);

		const get = makePlaylistLibraryGet();

		await expect(Effect.runPromise(fetchPlaylistLibrary(get))).rejects.toThrow(
			/No Supabase client available/,
		);
	});
});
