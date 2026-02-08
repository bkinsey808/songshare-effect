import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";

import type { SubscriptionConfig } from "../subscription-types";

import createRealtimeSubscription from "./createRealtimeSubscription";

vi.mock("../status/handleSubscriptionStatus");

function callSub(
	cb: ((status: string, err?: unknown) => void) | undefined,
	status: string,
	err?: unknown,
): void {
	if (typeof cb === "function") {
		cb(status, err);
		return;
	}

	throw new TypeError("subscribe callback not set");
}

function noopOnEvent(_payload: unknown): void {
	// noop
}

function noopOnStatus(_status: string, _err?: unknown): void {
	// noop
}

describe("createRealtimeSubscription", () => {
	const channelObj = { id: "chan-1" };

	it("subscribes with provided channel name and filter and calls onEvent", async () => {
		let onEventCallback: (payload: unknown) => void = noopOnEvent;
		let _subscribeCallback: ((status: string, err?: unknown) => void) | undefined = noopOnStatus;

		const client = {
			from: (
				_tableName: string,
			): {
				select: (column: string) => {
					eq: (colName: string, val: string) => { single: () => Promise<unknown> };
				};
			} => ({
				select: (
					_col: string,
				): { eq: (colName: string, val: string) => { single: () => Promise<unknown> } } => ({
					eq: (_colName: string, _val: string): { single: () => Promise<unknown> } => ({
						single: async (): Promise<unknown> => {
							await Promise.resolve();
							return { data: undefined, error: undefined };
						},
					}),
				}),
			}),
			channel: vi.fn().mockImplementation((_channelName: string) => ({
				on: (
					_eventName: string,
					_opts: unknown,
					handler: (payload: unknown) => void,
				): { subscribe: (cb: (status: string, err?: unknown) => void) => unknown } => ({
					subscribe: (cb: (status: string, err?: unknown) => void): unknown => {
						_subscribeCallback = cb;
						onEventCallback = handler;
						return channelObj;
					},
				}),
			})),
			removeChannel: vi.fn(),
			auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
		};

		const onEvent = vi.fn((_payload: unknown) => Effect.succeed(undefined));
		const onStatus = vi.fn();

		const config: SubscriptionConfig = {
			client,
			tableName: "song_library",
			filter: "owner=eq.123",
			onEvent,
			channelName: "test-channel",
			onStatus,
		};

		const cleanup = createRealtimeSubscription(config);

		// channel called with explicit name
		expect(client.channel).toHaveBeenCalledWith("test-channel");

		// Ensure on handler was captured
		expect(typeof onEventCallback).toBe("function");

		// simulate incoming payload
		const payload = { eventType: "INSERT" };
		onEventCallback(payload);
		// wait for microtask to allow async handler to run
		await Promise.resolve();

		expect(onEvent).toHaveBeenCalledWith(payload);

		// simulate status change - should call provided onStatus
		callSub(_subscribeCallback, "STATUS", { code: 123 });
		expect(onStatus).toHaveBeenCalledWith("STATUS", { code: 123 });

		// cleanup should remove the channel (pass through channel object)
		cleanup();
		expect(client.removeChannel).toHaveBeenCalledWith(channelObj);
	});

	it("uses default handleSubscriptionStatus when onStatus not provided", async () => {
		let _subscribeCallback: ((status: string, err?: unknown) => void) | undefined = undefined;

		const client = {
			from: (
				_tableName: string,
			): {
				select: (column: string) => {
					eq: (colName: string, val: string) => { single: () => Promise<unknown> };
				};
			} => ({
				select: (
					_column: string,
				): { eq: (colName: string, val: string) => { single: () => Promise<unknown> } } => ({
					eq: (_colName: string, _val: string): { single: () => Promise<unknown> } => ({
						single: async (): Promise<unknown> => {
							await Promise.resolve();
							return { data: undefined, error: undefined };
						},
					}),
				}),
			}),
			channel: vi.fn().mockImplementation(() => ({
				on: (
					_eventName: string,
					_opts: unknown,
					_handler: (payload: unknown) => void,
				): { subscribe: (cb: (status: string, err?: unknown) => void) => unknown } => ({
					subscribe: (cb: (status: string, err?: unknown) => void): unknown => {
						_subscribeCallback = cb;
						return channelObj;
					},
				}),
			})),
			removeChannel: vi.fn(),
			auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
		};

		const onEvent = vi.fn(() => Effect.succeed(undefined));

		const config: SubscriptionConfig = {
			client,
			tableName: "song_library",
			onEvent,
		};

		createRealtimeSubscription(config);

		// simulate subscribe status callback
		callSub(_subscribeCallback, "CHANNEL_ERROR", { message: "boom" });

		// Import the mocked module dynamically to ensure we check the mocked function
		const mod = await import("../status/handleSubscriptionStatus");
		expect(mod.default).toHaveBeenCalledWith("song_library", "CHANNEL_ERROR", {
			message: "boom",
		});
	});

	it("logs error but does not throw when onEvent throws", async () => {
		let onEventCallback: (payload: unknown) => void = noopOnEvent;

		const base = createMinimalSupabaseClient();
		const client: ReturnType<typeof createMinimalSupabaseClient> = {
			...base,
			from: (_tableName: string): ReturnType<typeof base.from> => ({
				select: (
					_column: string,
				): { eq: (colName: string, val: string) => { single: () => Promise<unknown> } } => ({
					eq: (_colName: string, _val: string): { single: () => Promise<unknown> } => ({
						single: async (): Promise<unknown> => {
							await Promise.resolve();
							return { data: undefined, error: undefined };
						},
					}),
				}),
			}),
			channel: vi.fn().mockImplementation((_channelName: string) => ({
				on: (
					_eventName: string,
					_opts: unknown,
					handler: (payload: unknown) => void,
				): { subscribe: (cb: (status: string, err?: unknown) => void) => unknown } => ({
					subscribe: (_cb: (status: string, err?: unknown) => void): unknown => {
						onEventCallback = handler;
						return channelObj;
					},
				}),
			})),
			removeChannel: vi.fn(),
			auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
		};

		const badError = new Error("bad");
		const onEvent = vi.fn(() => Effect.fail(badError));

		const config: SubscriptionConfig = {
			client,
			tableName: "song_library",
			onEvent,
		};

		// spy console.error
		const spyErr = vi.spyOn(console, "error").mockImplementation(() => undefined);

		createRealtimeSubscription(config);

		// invoke event with throwing handler
		onEventCallback({});

		// wait microtasks for the async IIFE and inner async handler
		await Promise.resolve();
		await Promise.resolve();

		expect(onEvent).toHaveBeenCalledWith({});
		// The runtime may wrap Effect failures; assert console.error was called with an Error that contains the message
		expect(spyErr).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ message: badError.message }),
		);

		spyErr.mockRestore();
	});
});
