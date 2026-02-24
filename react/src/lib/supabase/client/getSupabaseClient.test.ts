import { describe, expect, it, vi } from "vitest";

import {
	createClientOptionsMatcher,
	makeFakeClient,
	setup,
	toCreateClientReturn,
} from "./getSupabaseClient.test-util";

// timing constants used in tests
const MS_IN_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const EVICTION_BUFFER_MINUTES = 2;
const HOUR_MS = MINUTES_PER_HOUR * MS_IN_MINUTE;
const TWO_MINUTES_MS = EVICTION_BUFFER_MINUTES * MS_IN_MINUTE;

describe("getSupabaseClient", () => {
	it("returns undefined when env is missing", async () => {
		const { envMockInternal, createClientMockInternal } = await setup();
		// ensure both variables are absent so the guard at the top of
		// `getSupabaseClient` bails out immediately
		envMockInternal.mockImplementation(() => undefined);

		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const result = getSupabaseClient("token");
		expect(result).toBeUndefined();
		expect(createClientMockInternal).not.toHaveBeenCalled();
	});

	it("returns undefined when token is undefined or empty", async () => {
		const { createClientMockInternal } = await setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const r1 = getSupabaseClient(undefined);
		const r2 = getSupabaseClient("");

		expect(r1).toBeUndefined();
		expect(r2).toBeUndefined();
		expect(createClientMockInternal).not.toHaveBeenCalled();
	});

	it("creates a new client when inputs are valid", async () => {
		const { createClientMockInternal, globalCache } = await setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const token = "tok123";
		const client = makeFakeClient();
		createClientMockInternal.mockReturnValue(toCreateClientReturn(client));
		const result = getSupabaseClient(token);

		expect(createClientMockInternal).toHaveBeenCalledWith(
			"https://example.supabase.co",
			"anon-key",
			createClientOptionsMatcher(token),
		);

		// client cached
		expect(globalCache.get(token)).toBe(client);

		// returned value should pass through guard
		expect(result).toBe(client);
	});

	it("reuses a cached client when called with the same token", async () => {
		const { globalCache, createClientMockInternal } = await setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const token = "abc";
		const existing = makeFakeClient();
		globalCache.set(token, existing);

		const result = getSupabaseClient(token);
		expect(result).toBe(existing);
		expect(createClientMockInternal).not.toHaveBeenCalled();
	});

	it("schedules cache eviction after one hour", async () => {
		const { globalCache, createClientMockInternal } = await setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		vi.useFakeTimers();
		const token = "temp";
		const client = makeFakeClient();
		createClientMockInternal.mockReturnValue(toCreateClientReturn(client));
		const deleteSpy = vi.spyOn(globalCache, "delete");

		getSupabaseClient(token);

		// eviction should not have happened yet
		expect(deleteSpy).not.toHaveBeenCalled();

		// advance by just under an hour
		vi.advanceTimersByTime(HOUR_MS - TWO_MINUTES_MS);
		expect(deleteSpy).not.toHaveBeenCalled();

		// advance past the hour boundary
		vi.advanceTimersByTime(TWO_MINUTES_MS);
		expect(deleteSpy).toHaveBeenCalledWith(token);

		vi.useRealTimers();
	});
});
