import { describe, expect, it, vi } from "vitest";

import type { SupabaseRealtimeClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import { makeFakeClient } from "@/react/lib/supabase/client/test-util";
import isRecord from "@/shared/type-guards/isRecord";

import makeInvitationSlice from "./slice/makeInvitationSlice.test-util";
import subscribeToPendingInvitations from "./subscribeToPendingInvitations";

vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");
vi.mock("@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike");
vi.mock("@/shared/type-guards/isRecord");

const mockedGetClient = vi.mocked(getSupabaseClientWithAuth);
const mockedGuard = vi.mocked(guardAsSupabaseRealtimeClientLike);
const mockedIsRecord = vi.mocked(isRecord);

describe("subscribeToPendingInvitations", () => {
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

		let callIndex = 0;
		const slots = [handlers.community, handlers.event, handlers.system, handlers.system] as const;

		type ChannelLike = {
			on(event: string, opts: unknown, handler: (payload: unknown) => void): ChannelLike;
			subscribe(cb: (status: string, err: unknown) => void): void;
		};

		const channel: ChannelLike = {
			on(_event: string, _opts: unknown, handler: (payload: unknown) => void): ChannelLike {
				const target = slots[callIndex++];
				target?.push(handler);
				return channel;
			},
			subscribe(cb: (status: string, err: unknown) => void): void {
				cb("SUBSCRIBED", undefined);
			},
		} as const;

		const realtimeClient: SupabaseRealtimeClientLike = {
			channel(_name: string) {
				return channel;
			},
			removeChannel: vi.fn(),
		};

		const fake = makeFakeClient();
		fake.channel = (_name: string): typeof channel => channel;
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
	});
});
