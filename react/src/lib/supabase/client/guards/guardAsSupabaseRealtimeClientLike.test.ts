import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import guardAsSupabaseRealtimeClientLike from "./guardAsSupabaseRealtimeClientLike";

const INVALID_PRIMITIVE = 42;

/**
 * Returns an empty object to satisfy the `channel()` return type in the guard.
 *
 * @returns A minimal placeholder object
 */
function mockChannel(): object {
	return {};
}

/**
 * Returns an empty object to satisfy the `removeChannel()` return type in the guard.
 *
 * @returns A minimal placeholder object
 */
function mockRemoveChannel(): object {
	return {};
}

/**
 * Build a minimal realtime client stub with `channel` and `removeChannel`.
 *
 * @returns An object that mimics the minimal required realtime API
 */
function makeMockRealtimeClient(): { channel: () => object; removeChannel: () => object } {
	return {
		channel: mockChannel,
		removeChannel: mockRemoveChannel,
	};
}

describe("guardAsSupabaseRealtimeClientLike", () => {
	it("returns value when channel and removeChannel are functions", () => {
		const client = makeMockRealtimeClient();
		expect(guardAsSupabaseRealtimeClientLike(client)).toBe(client);
	});

	it("returns undefined for non-record input", () => {
		expect(guardAsSupabaseRealtimeClientLike(makeNull())).toBeUndefined();
		expect(guardAsSupabaseRealtimeClientLike(undefined)).toBeUndefined();
		expect(guardAsSupabaseRealtimeClientLike("string")).toBeUndefined();
	});

	it("returns undefined when channel is not a function", () => {
		const client = makeMockRealtimeClient();
		expect(
			guardAsSupabaseRealtimeClientLike({
				...client,
				channel: "not-a-fn",
			}),
		).toBeUndefined();
	});

	it("returns undefined when removeChannel is not a function", () => {
		const client = makeMockRealtimeClient();
		expect(
			guardAsSupabaseRealtimeClientLike({
				...client,
				removeChannel: INVALID_PRIMITIVE,
			}),
		).toBeUndefined();
	});

	it("returns undefined when required methods are missing", () => {
		expect(guardAsSupabaseRealtimeClientLike({})).toBeUndefined();
		expect(guardAsSupabaseRealtimeClientLike({ channel: mockChannel })).toBeUndefined();
	});
});
