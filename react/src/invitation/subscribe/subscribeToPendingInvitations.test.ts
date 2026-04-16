import { describe, expect, it, vi } from "vitest";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import type { SupabaseRealtimeClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import { makeFakeClient } from "@/react/lib/supabase/client/test-util";
import isRecord from "@/shared/type-guards/isRecord";

import makeInvitationSlice from "../slice/makeInvitationSlice.test-util";
import subscribeToPendingInvitations from "./subscribeToPendingInvitations";

vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");
vi.mock("@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike");
vi.mock("@/shared/type-guards/isRecord");

const mockedGetClient = vi.mocked(getSupabaseClientWithAuth);
const mockedGuard = vi.mocked(guardAsSupabaseRealtimeClientLike);
const mockedIsRecord = vi.mocked(isRecord);

describe("subscribeToPendingInvitations", () => {
	const EXPECT_TWO_CHANNELS = 2;
	const FIRST_CHANNEL_INDEX = 0;
	const SECOND_CHANNEL_INDEX = 1;
	const ONE_STEP = 1;

	it("handles missing Supabase client gracefully", async () => {
		vi.resetAllMocks();
		mockedGetClient.mockResolvedValueOnce(undefined);

		const slice = makeInvitationSlice();

		const cleanup = subscribeToPendingInvitations("user-1", () => slice);

		// wait a microtask for async setup to run
		await Promise.resolve();

		// calling cleanup should not throw
		expect(() => {
			cleanup();
		}).not.toThrow();
	});

	it("adds community and event invitations on INSERT", async () => {
		vi.resetAllMocks();

		const handlers: Record<"community" | "event" | "system", ((payload: unknown) => void)[]> = {
			community: [],
			event: [],
			system: [],
		};

		/**
		 * Minimal Channel-like mock used in tests to capture handlers.
		 */
		type ChannelLike = {
			/** Register an event handler for the mock channel */
			on(event: string, opts: unknown, handler: (payload: unknown) => void): ChannelLike;
			/** Subscribe to the mock channel and receive a status callback */
			subscribe(cb: (status: string, err: unknown) => void): void;
		};

		const createdChannels: ChannelLike[] = [];
		let onCallIndex = 0;
		const onCallSlots = [
			handlers.community,
			handlers.system,
			handlers.event,
			handlers.system,
		] as const;

		/**
		 * Create a fresh mocked channel instance for tests. The implementation
		 * pushes handlers into `handlers` arrays so the test can simulate events.
		 *
		 * @returns ChannelLike mock
		 */
		function createChannel(): ChannelLike {
			const channel: ChannelLike = {
				/**
				 * Register an event handler for the mock channel.
				 *
				 * @param _event - event name (ignored in mock)
				 * @param _opts - event options (ignored in mock)
				 * @param handler - handler invoked with payload in tests
				 * @returns ChannelLike the mock channel for chaining
				 */
				on(_event: string, _opts: unknown, handler: (payload: unknown) => void): ChannelLike {
					onCallSlots[onCallIndex]?.push(handler);
					onCallIndex += ONE_STEP;
					return channel;
				},

				/**
				 * Subscribe to the mock channel and receive a status callback.
				 *
				 * @param cb - callback invoked with subscription status and optional error
				 * @returns void
				 */
				subscribe(cb: (status: string, err: unknown) => void): void {
					cb("SUBSCRIBED", undefined);
				},
			};
			createdChannels.push(channel);
			return channel;
		}

		const realtimeClient: SupabaseRealtimeClientLike = {
			/**
			 * Create or return a mock channel for the given name.
			 *
			 * @param _name - channel name (ignored in mock)
			 * @returns ChannelLike mock instance
			 */
			channel(_name: string) {
				return createChannel();
			},
			removeChannel: vi.fn(),
		};

		const fake = makeFakeClient();
		/**
		 * Create or return a mock channel for the given name (test client).
		 *
		 * @param _name - channel name (ignored for test)
		 * @returns ChannelLike mock instance
		 */
		fake.channel = (_name: string): ChannelLike => createChannel();
		fake.removeChannel = realtimeClient.removeChannel;

		mockedGetClient.mockResolvedValueOnce(
			fake as Awaited<ReturnType<typeof getSupabaseClientWithAuth>>,
		);
		mockedGuard.mockReturnValueOnce(realtimeClient);
		mockedIsRecord.mockReturnValue(true as boolean);

		const setPendingCommunityInvitations = vi.fn();
		const setPendingEventInvitations = vi.fn();

		const slice = makeInvitationSlice({
			pendingCommunityInvitations: [],
			pendingEventInvitations: [],
			setPendingCommunityInvitations,
			setPendingEventInvitations,
		});

		const cleanup = subscribeToPendingInvitations("user-42", () => slice);

		// allow async setup
		await Promise.resolve();

		// Simulate community INSERT
		const communityPayload = {
			eventType: "INSERT",
			new: { community_id: "c1", status: "invited" },
		};
		for (const handler of handlers.community) {
			handler(communityPayload as unknown);
		}

		expect(setPendingCommunityInvitations).toHaveBeenCalledWith([
			{ community_id: "c1", community_name: "c1", community_slug: "c1" },
		]);

		// Simulate event INSERT
		const eventPayload = { eventType: "INSERT", new: { event_id: "e1", status: "invited" } };
		for (const handler of handlers.event) {
			handler(eventPayload as unknown);
		}

		expect(setPendingEventInvitations).toHaveBeenCalledWith([
			{ event_id: "e1", event_name: "e1", event_slug: "e1" },
		]);

		// cleanup should call removeChannel without throwing
		expect(() => {
			cleanup();
		}).not.toThrow();
		expect(realtimeClient.removeChannel).toHaveBeenCalledTimes(EXPECT_TWO_CHANNELS);
		expect(realtimeClient.removeChannel).toHaveBeenCalledWith(createdChannels[FIRST_CHANNEL_INDEX]);
		expect(realtimeClient.removeChannel).toHaveBeenCalledWith(
			createdChannels[SECOND_CHANNEL_INDEX],
		);
	});
});
