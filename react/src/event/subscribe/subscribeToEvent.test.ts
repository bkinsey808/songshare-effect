import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import assert from "node:assert";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";

import type { Get } from "@/react/app-store/app-store-types";
import type {
	RealtimeChannelLike,
	SupabaseClientLike,
	SupabaseRealtimeClientLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsSupabaseRealtimeClientLike from "@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type { EventEntry, EventPublic, EventUser } from "../event-types";
import type { EventSlice } from "../slice/EventSlice.type";

import { isEventPublic, isEventUser } from "../guards/guardEventTypes";
import subscribeToEvent from "./subscribeToEvent";

// Mock dependencies
vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");
vi.mock("@/react/lib/supabase/client/guards/guardAsSupabaseRealtimeClientLike");
vi.mock("../guards/guardEventTypes");

const MACROTASK_DELAY = 10;
async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await delay(MACROTASK_DELAY);
}

const EXPECTED_PARTICIPANT_COUNT = 1;
const DELETED_PARTICIPANT_COUNT = 0;

/**
 * Type guard that verifies a value is a `set` updater function.
 */
function isUpdater(
	value: unknown,
): value is (state: ReadonlyDeep<EventSlice>) => Partial<ReadonlyDeep<EventSlice>> {
	return typeof value === "function";
}

type TestContext = {
	eventId: string;
	ownerId: string;
	initialEvent: EventEntry;
	set: ReturnType<typeof vi.fn>;
	get: ReturnType<typeof vi.fn>;
	handlers: Record<string, (payload: unknown) => void>;
	mockChannel: RealtimeChannelLike;
	mockClient: SupabaseClientLike;
	removeChannelSpy: ReturnType<typeof vi.fn>;
};

function setupTest(): TestContext {
	const eventId = "event-123";
	const ownerId = "owner-456";

	const initialEvent: EventEntry = {
		event_id: eventId,
		owner_id: ownerId,
		owner_username: "owner_user",
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		private_notes: "",
		public: {
			event_id: eventId,
			event_name: "Initial Event",
			event_slug: "initial-event",
			owner_id: ownerId,
			is_public: true,
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
		},
		participants: [],
	};

	const set = vi.fn();
	const get = vi.fn<Get<EventSlice>>().mockReturnValue(
		forceCast<EventSlice>({
			currentEvent: forceCast<ReadonlyDeep<EventEntry>>(initialEvent),
		}),
	);

	const handlers: Record<string, (payload: unknown) => void> = {};
	const mockChannel = forceCast<RealtimeChannelLike>({
		on: vi.fn((_event: string, opts: { table: string }, handler: (payload: unknown) => void) => {
			handlers[opts.table] = handler;
			return mockChannel;
		}),
		subscribe: vi.fn((cb: (status: string, err?: unknown) => void) => {
			cb(String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED), undefined);
			return mockChannel;
		}),
	});

	const mockClient = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
	vi.spyOn(mockClient, "channel").mockReturnValue(mockChannel);
	const removeChannelSpy = vi.fn();
	vi.spyOn(mockClient, "removeChannel").mockImplementation(removeChannelSpy);

	vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(mockClient);
	vi.mocked(guardAsSupabaseRealtimeClientLike).mockReturnValue(
		forceCast<SupabaseRealtimeClientLike>(mockClient),
	);

	return {
		eventId,
		ownerId,
		initialEvent,
		set,
		get,
		handlers,
		mockChannel,
		mockClient,
		removeChannelSpy,
	};
}

describe("subscribeToEvent", () => {
	it("sets up subscriptions with correct parameters", async () => {
		const { eventId, mockClient, mockChannel, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();

		await flushPromises();

		expect(mockClient.channel).toHaveBeenCalledWith(expect.stringContaining(`event_${eventId}_`));
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({ table: "event_public" }),
			expect.any(Function),
		);
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({ table: "event_user" }),
			expect.any(Function),
		);
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({ table: "user_public" }),
			expect.any(Function),
		);
	});

	it("handles event_public UPDATE correctly", async () => {
		const { initialEvent, handlers, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();
		await flushPromises();

		const eventPublicData = initialEvent.public;
		assert.ok(eventPublicData !== undefined);
		const updatedPublic: EventPublic = {
			...eventPublicData,
			event_name: "Updated Event Name",
		};
		vi.mocked(isEventPublic).mockReturnValue(true);

		const eventPublicHandler = handlers["event_public"];
		assert.ok(eventPublicHandler !== undefined);
		eventPublicHandler({ eventType: "UPDATE", new: updatedPublic });

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		const calls = forceCast<[unknown[]]>(set.mock.calls);
		const [firstCall] = calls;
		assert.ok(firstCall !== undefined);
		const [eventPublicUpdater] = firstCall;
		assert.ok(isUpdater(eventPublicUpdater));

		const stateAfterUpdate = eventPublicUpdater(
			forceCast<ReadonlyDeep<EventSlice>>({
				currentEvent: forceCast<ReadonlyDeep<EventEntry>>(initialEvent),
			}),
		);

		assert.ok(stateAfterUpdate.currentEvent !== undefined);
		assert.ok(stateAfterUpdate.currentEvent.public !== undefined);
		expect(stateAfterUpdate.currentEvent.public.event_name).toBe("Updated Event Name");
	});

	it("updates store when payload contains only partial event_public fields", async () => {
		const { handlers, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();
		await flushPromises();

		// simulate a realtime payload that only contains the active_song_id field
		const partialPayload = { active_song_id: "song-xyz" };

		// ensure the strict guard is not relied upon in this case
		vi.mocked(isEventPublic).mockReturnValue(false);

		const eventPublicHandler = handlers["event_public"];
		assert.ok(eventPublicHandler !== undefined);
		eventPublicHandler({ eventType: "UPDATE", new: partialPayload });

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		const calls = forceCast<[unknown[]]>(set.mock.calls);
		const [firstCall] = calls;
		const [updater] = firstCall;
		assert.ok(isUpdater(updater));

		const stateAfter = updater(
			forceCast<ReadonlyDeep<EventSlice>>({
				currentEvent: forceCast<ReadonlyDeep<EventEntry>>({
					event_id: "event-123",
					owner_id: "owner-456",
					owner_username: "owner_user",
					created_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
					private_notes: "",
					public: {
						event_id: "event-123",
						event_name: "Initial",
						event_slug: "initial",
						owner_id: "owner-456",
						is_public: true,
						created_at: "2026-01-01T00:00:00Z",
						updated_at: "2026-01-01T00:00:00Z",
					},
					participants: [],
				}),
			}),
		);

		// optional chaining on public row to satisfy TS
		expect(stateAfter.currentEvent?.public?.active_song_id).toBe("song-xyz");
	});

	it("handles event_user INSERT correctly", async () => {
		const { eventId, initialEvent, handlers, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();
		await flushPromises();

		const newParticipant: EventUser = {
			event_id: eventId,
			user_id: "user-789",
			joined_at: "2026-02-01T00:00:00Z",
			role: "participant",
			status: "joined",
		};
		vi.mocked(isEventUser).mockReturnValue(true);

		const eventUserHandler = handlers["event_user"];
		assert.ok(eventUserHandler !== undefined);
		eventUserHandler({ eventType: "INSERT", new: newParticipant });

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		const calls = forceCast<[unknown[]]>(set.mock.calls);
		const [firstCall] = calls;
		assert.ok(firstCall !== undefined);
		const [eventUserInsertUpdater] = firstCall;
		assert.ok(isUpdater(eventUserInsertUpdater));

		const stateAfterInsert = eventUserInsertUpdater(
			forceCast<ReadonlyDeep<EventSlice>>({
				currentEvent: forceCast<ReadonlyDeep<EventEntry>>(initialEvent),
			}),
		);

		assert.ok(stateAfterInsert.currentEvent !== undefined);
		assert.ok(stateAfterInsert.currentEvent.participants !== undefined);
		expect(stateAfterInsert.currentEvent.participants).toHaveLength(EXPECTED_PARTICIPANT_COUNT);
		const [firstParticipant] = forceCast<EventUser[]>(stateAfterInsert.currentEvent.participants);
		assert.ok(firstParticipant !== undefined);
		expect(firstParticipant.user_id).toBe("user-789");
	});

	it("handles event_user DELETE correctly", async () => {
		const { eventId, initialEvent, handlers, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();
		await flushPromises();

		const eventUserHandler = handlers["event_user"];
		assert.ok(eventUserHandler !== undefined);
		eventUserHandler({ eventType: "DELETE", old: { user_id: "user-789" } });

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		const calls = forceCast<[unknown[]]>(set.mock.calls);
		const [firstCall] = calls;
		assert.ok(firstCall !== undefined);
		const [eventUserDeleteUpdater] = firstCall;
		assert.ok(isUpdater(eventUserDeleteUpdater));

		const stateBeforeDelete = forceCast<ReadonlyDeep<EventSlice>>({
			currentEvent: {
				...initialEvent,
				participants: [
					{ user_id: "user-789", event_id: eventId, joined_at: "", role: "", status: "" },
				],
			},
		});

		const stateAfterDelete = eventUserDeleteUpdater(stateBeforeDelete);
		assert.ok(stateAfterDelete.currentEvent !== undefined);
		assert.ok(stateAfterDelete.currentEvent.participants !== undefined);
		expect(stateAfterDelete.currentEvent.participants).toHaveLength(DELETED_PARTICIPANT_COUNT);
	});

	it("handles user_public UPDATE correctly", async () => {
		const { eventId, initialEvent, handlers, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		start();
		await flushPromises();

		const userUpdatePayload = { user_id: "user-789", username: "NewUsername" };
		const userPublicHandler = handlers["user_public"];
		assert.ok(userPublicHandler !== undefined);
		userPublicHandler({ eventType: "UPDATE", new: userUpdatePayload });

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		const calls = forceCast<[unknown[]]>(set.mock.calls);
		const [firstCall] = calls;
		assert.ok(firstCall !== undefined);
		const [userPublicUpdater] = firstCall;
		assert.ok(isUpdater(userPublicUpdater));

		const stateBeforeUpdate = forceCast<ReadonlyDeep<EventSlice>>({
			currentEvent: {
				...initialEvent,
				participants: [
					{
						user_id: "user-789",
						username: "OldUsername",
						event_id: eventId,
						joined_at: "",
						role: "",
						status: "",
					},
				],
			},
		});

		const stateAfterUpdate = userPublicUpdater(stateBeforeUpdate);
		assert.ok(stateAfterUpdate.currentEvent !== undefined);
		assert.ok(stateAfterUpdate.currentEvent.participants !== undefined);
		const participants = forceCast<{ username: string }[]>(
			stateAfterUpdate.currentEvent.participants,
		);
		const [firstParticipant] = participants;
		assert.ok(firstParticipant !== undefined);
		expect(firstParticipant.username).toBe("NewUsername");
	});

	it("unsubscribes correctly on cleanup", async () => {
		const { mockChannel, removeChannelSpy, set, get } = setupTest();
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		const outerCleanup = start();

		await flushPromises();

		assert.ok(outerCleanup !== undefined);
		outerCleanup();

		expect(removeChannelSpy).toHaveBeenCalledWith(mockChannel);
	});

	it("returns undefined if no current event", () => {
		const { set, get } = setupTest();
		get.mockReturnValue(
			forceCast<EventSlice>({
				currentEvent: undefined,
			}),
		);
		const start = subscribeToEvent(forceCast(set), forceCast(get));
		expect(start()).toBeUndefined();
	});
});
