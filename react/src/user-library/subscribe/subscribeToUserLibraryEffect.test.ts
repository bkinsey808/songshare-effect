import { Effect } from "effect";
import assert from "node:assert";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import makeUserLibrarySlice from "../slice/makeUserLibrarySlice.mock";
import subscribeToUserLibrary from "./subscribeToUserLibraryEffect";

// Use shared test helper for slice

describe("subscribeToUserLibraryEffect", () => {
	it("creates a realtime subscription and returns cleanup", async () => {
		vi.resetAllMocks();

		const authSpy = await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const clientSpy = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		const createRealtimeModule =
			await import("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

		authSpy.mockResolvedValue("token-xyz");
		clientSpy.mockReturnValue(createMinimalSupabaseClient());

		const cleanupFn: () => void = vi.fn();
		const createRealtimeMock = vi.spyOn(createRealtimeModule, "default").mockReturnValue(cleanupFn);

		const get = makeUserLibrarySlice();

		const cleanup = await Effect.runPromise(subscribeToUserLibrary(get));

		const CALL_INDEX = 0;
		const ARG_INDEX = 0;
		const config = createRealtimeMock.mock.calls[CALL_INDEX]?.[ARG_INDEX];
		assert.ok(
			typeof config === "object",
			"createRealtimeSubscription was not called with expected config",
		);
		expect(config.tableName).toBe("user_library");
		expect(typeof config.onEvent).toBe("function");

		// ensure returned cleanup is a function
		expect(typeof cleanup).toBe("function");

		createRealtimeMock.mockRestore();
		vi.restoreAllMocks();
	});

	it("throws when no supabase client available", async () => {
		vi.resetAllMocks();
		const auth = await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const client = await import("@/react/lib/supabase/client/getSupabaseClient");

		vi.spyOn(auth, "default").mockResolvedValue("token-xyz");
		vi.spyOn(client, "default").mockReturnValue(undefined);

		const get = makeUserLibrarySlice();

		await expect(Effect.runPromise(subscribeToUserLibrary(get))).rejects.toThrow(
			/No Supabase client available/,
		);

		vi.restoreAllMocks();
	});
});
