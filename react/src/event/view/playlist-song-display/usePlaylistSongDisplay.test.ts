import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import fetchUsername from "@/react/lib/supabase/enrichment/fetchUsername";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import { makeTestSong } from "@/react/song/test-utils/makeTestSong.mock";

import usePlaylistSongDisplay from "./usePlaylistSongDisplay";

vi.mock("@/react/lib/supabase/enrichment/fetchUsername");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");

describe("usePlaylistSongDisplay (unit)", () => {
	it("returns undefined song and empty subText when songId is missing", () => {
		vi.resetAllMocks();

		const publicSongs = {} as Record<
			string,
			{ song_name?: string; user_id?: string; [key: string]: unknown }
		>;
		const { result } = renderHook(() => usePlaylistSongDisplay("missing", publicSongs));

		expect(result.current.song).toBeUndefined();
		expect(result.current.ownerUsername).toBeUndefined();
		expect(result.current.subText).toBe("");
	});

	it("does not call fetchUsername when getSupabaseClient returns undefined", async () => {
		vi.resetAllMocks();

		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(undefined);

		vi.mocked(fetchUsername).mockResolvedValue("should-not-be-used");

		const publicSongs = { s1: makeTestSong({ user_id: "u1" }) };
		const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

		// effect returns early when client is undefined
		expect(vi.mocked(fetchUsername)).not.toHaveBeenCalled();
		expect(result.current.ownerUsername).toBeUndefined();
		expect(result.current.subText).toBe("...");
	});

	it("does not call fetchUsername when song.user_id is undefined", async () => {
		vi.resetAllMocks();

		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		vi.mocked(fetchUsername).mockResolvedValue("should-not-be-used");

		const publicSongs = { s1: { song_name: "Song 1" } };
		const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

		expect(vi.mocked(fetchUsername)).not.toHaveBeenCalled();
		expect(result.current.ownerUsername).toBeUndefined();
		expect(result.current.subText).toBe("");
	});

	const CALLED_ONCE = 1;

	it.each<[string | undefined]>([[undefined], [""]])(
		"does not set ownerUsername when fetchUsername resolves to %p",
		async (fetched: string | undefined) => {
			vi.resetAllMocks();

			const mockGetSupabaseClientSpy = await spyImport(
				"@/react/lib/supabase/client/getSupabaseClient",
			);
			mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

			vi.mocked(fetchUsername).mockResolvedValueOnce(fetched);

			const publicSongs = { s1: makeTestSong({ user_id: "u1" }) };
			const { result } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

			// wait for the fetch to have been invoked
			await waitFor(() => {
				expect(vi.mocked(fetchUsername)).toHaveBeenCalledWith(expect.any(Object));
			});

			expect(result.current.ownerUsername).toBeUndefined();
			expect(result.current.subText).toBe("...");
		},
	);

	it("only fetches username once and does not re-fetch on rerender", async () => {
		vi.resetAllMocks();

		const mockGetSupabaseClientSpy = await spyImport(
			"@/react/lib/supabase/client/getSupabaseClient",
		);
		mockGetSupabaseClientSpy.mockReturnValue?.(createMinimalSupabaseClient());

		vi.mocked(fetchUsername).mockResolvedValue("user_one");

		const publicSongs = { s1: makeTestSong({ user_id: "u1" }) };
		const { result, rerender } = renderHook(() => usePlaylistSongDisplay("s1", publicSongs));

		await waitFor(() => {
			expect(result.current.ownerUsername).toBe("user_one");
		});

		// rerender with same inputs — should not trigger another fetch
		rerender();
		expect(vi.mocked(fetchUsername)).toHaveBeenCalledTimes(CALLED_ONCE);
	});
});
