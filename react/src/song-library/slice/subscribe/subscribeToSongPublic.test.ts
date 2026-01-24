import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { ONE_CALL } from "@/react/test-helpers/test-consts";

import type { SongLibrarySlice } from "../song-library-slice";

import subscribeToSongPublic from "./subscribeToSongPublic";

/* oxlint-disable typescript-eslint/no-unsafe-assignment,typescript-eslint/no-explicit-any,typescript-eslint/no-unsafe-type-assertion,typescript-eslint/no-unsafe-argument */

describe("subscribeToSongPublic", () => {
	it("backfills song_public rows and creates realtime subscription", async () => {
		// Arrange: slice with an existing entry missing public metadata
		const existingEntry = {
			song_id: "s1",
			song_owner_id: "owner",
			user_id: "owner",
			created_at: new Date().toISOString(),
		};
		const setSongLibraryEntries = vi.fn();
		const slice: Partial<SongLibrarySlice> = {
			songLibraryEntries: { s1: existingEntry } as any,
			setSongLibraryEntries: setSongLibraryEntries as any,
		};
		function get(): SongLibrarySlice {
			return slice as SongLibrarySlice;
		}

		// Mock auth/client/DB + subscription creation (dynamic imports for spy control)
		const authTokenModule = await import("@/react/supabase/auth-token/getSupabaseAuthToken");
		const clientModule = await import("@/react/supabase/client/getSupabaseClient");
		const callSelectModule = await import("@/react/supabase/client/safe-query/callSelect");
		const createRealtimeModule =
			await import("@/react/supabase/subscription/realtime/createRealtimeSubscription");

		vi.spyOn(authTokenModule, "default").mockResolvedValue("token-abc");
		vi.spyOn(clientModule, "default").mockReturnValue({} as any);
		const callSelectMock = vi.spyOn(callSelectModule, "default").mockResolvedValue({
			data: [{ song_id: "s1", song_name: "New Name", song_slug: "new-slug" }],
		});
		const cleanupSpy = vi.fn();
		const createRealtimeMock = vi
			.spyOn(createRealtimeModule, "default")
			.mockReturnValue(cleanupSpy as any);

		// Act
		const cleanup = await Effect.runPromise(subscribeToSongPublic(get, ["s1"]));

		// Assert: initial backfill applied (song_name/song_slug applied for s1)
		expect(setSongLibraryEntries).toHaveBeenCalledWith(
			expect.objectContaining({
				s1: expect.objectContaining({ song_name: "New Name", song_slug: "new-slug" }),
			}),
		);

		// Assert: subscription created with proper filter and status handler
		expect(createRealtimeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: expect.stringContaining("song_id=in"),
				onStatus: expect.any(Function),
			}),
		);

		// Cleanup returned function works
		cleanup();
		expect(cleanupSpy).toHaveBeenCalledTimes(ONE_CALL);

		// Restore mocks
		callSelectMock.mockRestore();
		createRealtimeMock.mockRestore();
		vi.restoreAllMocks();
	});
});
