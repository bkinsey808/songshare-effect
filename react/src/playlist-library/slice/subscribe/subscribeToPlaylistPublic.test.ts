import assert from "node:assert";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { PlaylistLibrarySlice } from "../PlaylistLibrarySlice.type";
import subscribeToPlaylistPublic from "./subscribeToPlaylistPublic";

function makePlaylistLibraryGet(): () => PlaylistLibrarySlice {
	const setPlaylistLibraryEntries = vi.fn();
	const stub = forceCast<PlaylistLibrarySlice>({
		playlistLibraryEntries: {},
		setPlaylistLibraryEntries,
	});
	return () => stub;
}

describe("subscribeToPlaylistPublic", () => {
	it("creates realtime subscription to playlist_public with filter and returns cleanup", async () => {
		vi.resetAllMocks();

		const authSpy = await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		const createRealtimeModule =
			await import("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

		authSpy.mockResolvedValue("token-xyz");
		clientSpy.mockReturnValue(createMinimalSupabaseClient());

		const cleanupFn: () => void = vi.fn();
		const createRealtimeMock = vi.spyOn(createRealtimeModule, "default").mockReturnValue(cleanupFn);

		const get = makePlaylistLibraryGet();
		const PLAYLIST_ID = "pid-1";

		const cleanup = await Effect.runPromise(subscribeToPlaylistPublic(get, [PLAYLIST_ID]));

		const CALL_INDEX = 0;
		const ARG_INDEX = 0;
		const config = createRealtimeMock.mock.calls[CALL_INDEX]?.[ARG_INDEX];
		assert.ok(
			typeof config === "object",
			"createRealtimeSubscription was not called with expected config",
		);
		expect(config.tableName).toBe("playlist_public");
		expect(config.filter).toContain('playlist_id=in.("pid-1")');
		expect(typeof config.onEvent).toBe("function");

		expect(typeof cleanup).toBe("function");
		cleanup();
		expect(cleanupFn).toHaveBeenCalledWith();

		createRealtimeMock.mockRestore();
		vi.restoreAllMocks();
	});

	it("returns no-op cleanup when playlistIds is empty", async () => {
		vi.resetAllMocks();
		const get = makePlaylistLibraryGet();

		const cleanup = await Effect.runPromise(subscribeToPlaylistPublic(get, []));

		expect(typeof cleanup).toBe("function");
		cleanup(); // Should not throw
	});

	it("fails when no Supabase client available", async () => {
		vi.resetAllMocks();
		const auth = await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const client = await import("@/react/lib/supabase/client/getSupabaseClient");

		vi.spyOn(auth, "default").mockResolvedValue("token-xyz");
		vi.spyOn(client, "default").mockReturnValue(undefined);

		const get = makePlaylistLibraryGet();

		await expect(Effect.runPromise(subscribeToPlaylistPublic(get, ["pid-1"]))).rejects.toThrow(
			/No Supabase client available/,
		);

		vi.restoreAllMocks();
	});
});
