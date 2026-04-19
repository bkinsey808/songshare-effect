import assert from "node:assert";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeSongLibraryEntry from "@/react/song-library/test-utils/makeSongLibraryEntry.mock";
import type { Database } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";

import makeSongLibrarySlice from "../makeSongLibrarySlice.mock";
import type { SongLibrarySlice } from "../song-library-slice";
import type { SongLibraryEntry } from "../song-library-types";
import subscribeToSongPublic from "./subscribeToSongPublic";

type CreateRealtimeConfig = {
	tableName: string;
	filter: string;
	onStatus: (status: string, err?: unknown) => void;
};

/**
 * Type guard asserting the shape passed to createRealtimeSubscription in tests.
 *
 * @param value - value to inspect
 * @returns true when value matches CreateRealtimeConfig
 */
function isCreateRealtimeConfig(value: unknown): value is CreateRealtimeConfig {
	return (
		isRecord(value) &&
		typeof value["tableName"] === "string" &&
		typeof value["filter"] === "string" &&
		typeof value["onStatus"] === "function"
	);
}

const MOCK_CALL_INDEX = 0;
const MOCK_ARG_INDEX = 0;

// Use shared helper `makeSongLibrarySlice` directly in tests

/**
 * Create a minimal Supabase client suitable for unit tests.
 *
 * @returns a minimal SupabaseClientLike instance
 */
function createMockSupabaseClient(): SupabaseClientLike<Database> {
	return createMinimalSupabaseClient<Database>();
}

describe("subscribeToSongPublic", () => {
	it("backfills song_public rows and creates realtime subscription", async () => {
		const existingEntry = makeSongLibraryEntry({
			song_id: "s1",
			song_owner_id: "owner",
			user_id: "owner",
			created_at: new Date().toISOString(),
		});
		const setSongLibraryEntries =
			vi.fn<(entries: Readonly<Record<string, SongLibraryEntry>>) => void>();
		const baseGet = makeSongLibrarySlice({ s1: existingEntry });
		const slice = { ...baseGet(), setSongLibraryEntries };

		/**
		 * Getter used by the tested subscription to access the current slice.
		 *
		 * @returns the test `SongLibrarySlice` instance
		 */
		function get(): SongLibrarySlice {
			return slice;
		}

		const authSpy = await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		const createRealtimeModule =
			await import("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

		authSpy.mockResolvedValue("token-abc");
		clientSpy.mockReturnValue(createMockSupabaseClient());
		const cleanupFn: () => void = vi.fn();
		const createRealtimeMock = vi.spyOn(createRealtimeModule, "default").mockReturnValue(cleanupFn);

		const cleanup = await Effect.runPromise(subscribeToSongPublic(get, ["s1"]));

		const expectedFilter = 'song_id=in.("s1")';
		const config = createRealtimeMock.mock.calls[MOCK_CALL_INDEX]?.[MOCK_ARG_INDEX];
		assert.ok(
			isCreateRealtimeConfig(config),
			"createRealtimeSubscription was not called with expected config",
		);
		expect(config.tableName).toBe("song_public");
		expect(config.filter).toBe(expectedFilter);

		cleanup();
		expect(cleanupFn).toHaveBeenCalledTimes(ONE_CALL);

		createRealtimeMock.mockRestore();
		vi.restoreAllMocks();
	});
});
