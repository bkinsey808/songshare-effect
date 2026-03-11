import assert from "node:assert";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import makeSongLibrarySlice from "../makeSongLibrarySlice.mock";
import subscribeToSongLibrary from "./subscribeToSongLibrary";

describe("subscribeToSongLibrary", () => {
	it("creates realtime subscription to song_library and returns cleanup", async () => {
		vi.resetAllMocks();

		const authSpy = await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		const createRealtimeModule =
			await import("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

		authSpy.mockResolvedValue("token-xyz");
		clientSpy.mockReturnValue(createMinimalSupabaseClient());

		const cleanupFn: () => void = vi.fn();
		const createRealtimeMock = vi
			.spyOn(createRealtimeModule, "default")
			.mockReturnValue(cleanupFn);

		const get = makeSongLibrarySlice();

		const cleanup = await Effect.runPromise(subscribeToSongLibrary(get));

		const CALL_INDEX = 0;
		const ARG_INDEX = 0;
		const config = createRealtimeMock.mock.calls[CALL_INDEX]?.[ARG_INDEX];
		assert.ok(
			typeof config === "object",
			"createRealtimeSubscription was not called with expected config",
		);
		expect(config.tableName).toBe("song_library");
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

		const get = makeSongLibrarySlice();

		await expect(Effect.runPromise(subscribeToSongLibrary(get))).rejects.toThrow(
			/No Supabase client available/,
		);

		vi.restoreAllMocks();
	});
});
