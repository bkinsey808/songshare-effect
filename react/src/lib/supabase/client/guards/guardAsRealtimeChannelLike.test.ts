import { describe, expect, it } from "vitest";

import type { RealtimeChannelLike } from "../SupabaseClientLike";

import guardAsRealtimeChannelLike from "./guardAsRealtimeChannelLike";

/**
 * Creates a minimal RealtimeChannelLike mock for testing.
 * @returns A mock channel object with on and subscribe methods.
 */
function createMockChannel(): RealtimeChannelLike {
	// minimal implementation matching `RealtimeChannelLike`; no need for spies.
	const channel: RealtimeChannelLike = {
		on(_event: string, _opts: unknown, _handler?: (payload: unknown) => void) {
			return channel;
		},
		subscribe(_cb?: (status: string, err?: unknown) => void) {
			return undefined;
		},
	};

	return channel;
}

describe("guardAsRealtimeChannelLike", () => {
	it("returns the channel when it has on and subscribe methods", () => {
		const channel = createMockChannel();

		const result = guardAsRealtimeChannelLike(channel);

		expect(result).toBe(channel);
	});

	it("returns undefined when on is missing", () => {
		const channel = createMockChannel();
		const { on: _on, ...withoutOn } = channel;

		const result = guardAsRealtimeChannelLike(withoutOn);

		expect(result).toBeUndefined();
	});

	it("returns undefined when subscribe is missing", () => {
		const channel = createMockChannel();
		const { subscribe: _subscribe, ...withoutSubscribe } = channel;

		const result = guardAsRealtimeChannelLike(withoutSubscribe);

		expect(result).toBeUndefined();
	});

	it("returns undefined when on is not a function", () => {
		const channel = createMockChannel();
		const invalidChannel = { ...channel, on: "not a function" };

		const result = guardAsRealtimeChannelLike(invalidChannel);

		expect(result).toBeUndefined();
	});

	it("returns undefined when subscribe is not a function", () => {
		const channel = createMockChannel();
		const invalidChannel = { ...channel, subscribe: {} };

		const result = guardAsRealtimeChannelLike(invalidChannel);

		expect(result).toBeUndefined();
	});

	it("returns undefined for non-record values", () => {
		expect(guardAsRealtimeChannelLike(undefined)).toBeUndefined();
		expect(guardAsRealtimeChannelLike("string")).toBeUndefined();
		expect(guardAsRealtimeChannelLike(false)).toBeUndefined();
		expect(guardAsRealtimeChannelLike([])).toBeUndefined();
	});
});
