import { describe, expect, it, vi } from "vitest";

// import mocks before the module under test so Vitest can hoist and apply them
import {
	makeFakeClient,
	setup,
	globalCache,
	envMock,
	createClientMock,
	HOUR_MS,
	TWO_MINUTES_MS,
	createClientOptionsMatcher,
	toCreateClientReturn,
} from "./getSupabaseClient.test-utils";

describe("getSupabaseClient", () => {
	it("returns undefined when env is missing", async () => {
		setup();
		// ensure both variables are absent so the guard at the top of
		// `getSupabaseClient` bails out immediately
		envMock.mockImplementation(() => undefined);

		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const result = getSupabaseClient("token");
		expect(result).toBeUndefined();
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("returns undefined when token is undefined or empty", async () => {
		setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const r1 = getSupabaseClient(undefined);
		const r2 = getSupabaseClient("");

		expect(r1).toBeUndefined();
		expect(r2).toBeUndefined();
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("creates a new client when inputs are valid", async () => {
		setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const token = "tok123";
		const client = makeFakeClient();
		createClientMock.mockReturnValue(toCreateClientReturn(client));
		const result = getSupabaseClient(token);

		expect(createClientMock).toHaveBeenCalledWith(
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
		setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		const token = "abc";
		const existing = makeFakeClient();
		globalCache.set(token, existing);

		const result = getSupabaseClient(token);
		expect(result).toBe(existing);
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("schedules cache eviction after one hour", async () => {
		setup();
		const { default: getSupabaseClient } = await import("./getSupabaseClient");
		vi.useFakeTimers();
		const token = "temp";
		const client = makeFakeClient();
		createClientMock.mockReturnValue(toCreateClientReturn(client));
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
