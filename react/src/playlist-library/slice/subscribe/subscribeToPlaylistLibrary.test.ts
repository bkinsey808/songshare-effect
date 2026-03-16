import assert from "node:assert";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { PlaylistLibrarySlice } from "../PlaylistLibrarySlice.type";
import subscribeToPlaylistLibrary from "./subscribeToPlaylistLibrary";

function makePlaylistLibraryGet(): () => PlaylistLibrarySlice {
	const addPlaylistLibraryEntry = vi.fn();
	const removePlaylistLibraryEntry = vi.fn();
	const stub = forceCast<PlaylistLibrarySlice>({
		playlistLibraryEntries: {},
		isPlaylistLibraryLoading: false,
		playlistLibraryError: undefined,
		addPlaylistLibraryEntry,
		removePlaylistLibraryEntry,
	});
	return () => stub;
}

describe("subscribeToPlaylistLibrary", () => {
	it("creates realtime subscription to playlist_library and returns cleanup", async () => {
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

		const cleanup = await Effect.runPromise(subscribeToPlaylistLibrary(get));

		const CALL_INDEX = 0;
		const ARG_INDEX = 0;
		const config = createRealtimeMock.mock.calls[CALL_INDEX]?.[ARG_INDEX];
		assert.ok(
			typeof config === "object",
			"createRealtimeSubscription was not called with expected config",
		);
		expect(config.tableName).toBe("playlist_library");
		expect(typeof config.onEvent).toBe("function");

		expect(typeof cleanup).toBe("function");
		cleanup();
		expect(cleanupFn).toHaveBeenCalledWith();

		createRealtimeMock.mockRestore();
		vi.restoreAllMocks();
	});

	it("fails when no Supabase client available", async () => {
		vi.resetAllMocks();
		const auth = await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const client = await import("@/react/lib/supabase/client/getSupabaseClient");

		vi.spyOn(auth, "default").mockResolvedValue("token-xyz");
		vi.spyOn(client, "default").mockReturnValue(undefined);

		const get = makePlaylistLibraryGet();

		await expect(Effect.runPromise(subscribeToPlaylistLibrary(get))).rejects.toThrow(
			/No Supabase client available/,
		);

		vi.restoreAllMocks();
	});
});
