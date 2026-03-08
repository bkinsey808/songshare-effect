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

		type ChannelLike = {
			on(event: string, opts: unknown, handler: (payload: unknown) => void): ChannelLike;
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

		function createChannel(): ChannelLike {
			const channel: ChannelLike = {
				on(_event: string, _opts: unknown, handler: (payload: unknown) => void): ChannelLike {
					onCallSlots[onCallIndex]?.push(handler);
					onCallIndex += ONE_STEP;
					return channel;
				},
				subscribe(cb: (status: string, err: unknown) => void): void {
					cb("SUBSCRIBED", undefined);
				},
			};
			createdChannels.push(channel);
			return channel;
		}

		const realtimeClient: SupabaseRealtimeClientLike = {
			channel(_name: string) {
				return createChannel();
			},
			removeChannel: vi.fn(),
		};

		const fake = makeFakeClient();
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
