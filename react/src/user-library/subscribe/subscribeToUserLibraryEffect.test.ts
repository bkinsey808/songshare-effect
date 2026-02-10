import { Effect } from "effect";
import assert from "node:assert";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import subscribeToUserLibrary from "./subscribeToUserLibraryEffect";

function createMockSlice(): UserLibrarySlice {
	const slice: UserLibrarySlice = {
		userLibraryEntries: {},
		isUserLibraryLoading: false,
		userLibraryError: undefined,
		setUserLibraryError: () => undefined,
		isInUserLibrary: () => false,
		addUserToLibrary: () => Effect.sync(() => undefined),
		removeUserFromLibrary: () => Effect.sync(() => undefined),
		getUserLibraryIds: () => [],
		fetchUserLibrary: () => Effect.sync(() => undefined),
		subscribeToUserLibrary: () => Effect.sync(() => (): void => undefined),
		subscribeToUserPublicForLibrary: () => Effect.sync(() => (): void => undefined),
		setUserLibraryEntries: () => undefined,
		setUserLibraryLoading: () => undefined,
		addUserLibraryEntry: () => undefined,
		removeUserLibraryEntry: () => undefined,
	};
	return slice;
}

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

		const slice = createMockSlice();
		function get(): UserLibrarySlice {
			return slice;
		}

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

		const slice = createMockSlice();
		function get(): UserLibrarySlice {
			return slice;
		}

		await expect(Effect.runPromise(subscribeToUserLibrary(get))).rejects.toThrow(
			/No Supabase client available/,
		);

		vi.restoreAllMocks();
	});
});
