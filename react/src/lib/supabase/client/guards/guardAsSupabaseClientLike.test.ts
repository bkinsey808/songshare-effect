import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "../SupabaseClientLike";
import guardAsSupabaseClientLike from "./guardAsSupabaseClientLike";

/**
 * Minimal realtime channel stub used to satisfy SupabaseClientLike in tests.
 *
 * @returns A channel-like object that supports `on`/`subscribe` chaining.
 */
type RealtimeChannelStub = {
	on: (event: string, opts: unknown, handler: (payload: unknown) => void) => RealtimeChannelStub;
	subscribe: (cb: (status: string, err?: unknown) => void) => undefined;
};

/**
 * Creates a minimal Supabase-like client with `from`, `auth`, and `channel`.
 *
 * @returns A client object matching the guard expectations used in tests.
 */
function createSupabaseClient(): SupabaseClientLike {
	const channel: RealtimeChannelStub = {
		/**
		 * Subscribe handler for the mock channel; returns the channel to allow chaining.
		 *
		 * @param _event - Event name (unused in stub)
		 * @param _opts - Options passed to `on` (unused in stub)
		 * @param _handler - Event handler to capture (unused in stub)
		 * @returns The channel stub for chaining
		 */
		on(_event: string, _opts: unknown, _handler: (payload: unknown) => void): RealtimeChannelStub {
			return channel;
		},
		/**
		 * Subscribe method placeholder; returns undefined in this minimal stub.
		 *
		 * @param _cb - Subscribe callback (unused)
		 * @returns undefined
		 */
		subscribe(_cb: (status: string, err?: unknown) => void): undefined {
			return undefined;
		},
	};

	return {
		from: vi.fn().mockReturnValue({ select: vi.fn() }),
		channel: vi.fn().mockReturnValue(channel),
		removeChannel: vi.fn(),
		auth: { getUser: vi.fn().mockResolvedValue({}) },
	};
}

describe("guardAsSupabaseClientLike", () => {
	it("returns the client when it exposes from and auth.getUser", () => {
		const client = createSupabaseClient();

		const result = guardAsSupabaseClientLike(client);

		expect(result).toBe(client);
	});

	it("returns undefined when from is missing or not a function", () => {
		const missingFrom = { auth: { getUser: vi.fn() } };
		const wrongFrom = { from: {}, auth: { getUser: vi.fn() } };

		expect(guardAsSupabaseClientLike(missingFrom)).toBeUndefined();
		expect(guardAsSupabaseClientLike(wrongFrom)).toBeUndefined();
	});

	it("returns undefined when auth is missing or malformed", () => {
		const missingAuth = { from: vi.fn() };
		const noGetUser = { from: vi.fn(), auth: {} };
		const undefinedAuth = { from: vi.fn(), auth: undefined };

		expect(guardAsSupabaseClientLike(missingAuth)).toBeUndefined();
		expect(guardAsSupabaseClientLike(noGetUser)).toBeUndefined();
		expect(guardAsSupabaseClientLike(undefinedAuth)).toBeUndefined();
	});
});
