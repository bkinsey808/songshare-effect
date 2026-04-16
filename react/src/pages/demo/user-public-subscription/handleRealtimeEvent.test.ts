import type { Dispatch, SetStateAction } from "react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import { handleRealtimeEvent, type RealtimeEvent } from "./handleRealtimeEvent";
import type { UserPublic } from "./isUserPublic";

const USER_ALICE: UserPublic = { user_id: "user-1", username: "alice" };
const USER_BOB: UserPublic = { user_id: "user-2", username: "bob" };

const FIRST_CALL_INDEX = 0;
const FIRST_ARG_INDEX = 0;
const SINGLE_EVENT_COUNT = 1;
const PAIR_COUNT = 2;

type EventsUpdater = (prev: RealtimeEvent[]) => RealtimeEvent[];
type UsersUpdater = (prev: UserPublic[]) => UserPublic[];

/**
 * Return the first argument from the first call in a mocked calls array.
 *
 * @param calls - array of call argument lists from a mocked function
 * @returns the first call's first argument typed as `TArg`
 */
function getFirstCallArg<TArg>(calls: unknown[][]): TArg {
	const first = calls[FIRST_CALL_INDEX];
	expect(first).toBeDefined();
	return forceCast<TArg>(forceCast<unknown[]>(first)[FIRST_ARG_INDEX]);
}

describe("handleRealtimeEvent", () => {
	it("adds INSERT event and appends user to list when payload has valid new", () => {
		const setEvents = vi.fn<Dispatch<SetStateAction<RealtimeEvent[]>>>();
		const setUsers = vi.fn<Dispatch<SetStateAction<UserPublic[]>>>();

		handleRealtimeEvent({
			payload: { new: USER_ALICE, old: undefined },
			eventType: "INSERT",
			setEvents,
			setUsers,
		});

		expect(setEvents).toHaveBeenCalledWith(expect.any(Function));
		expect(setUsers).toHaveBeenCalledWith(expect.any(Function));

		const eventsUpdater = getFirstCallArg<EventsUpdater>(setEvents.mock.calls);
		const eventsResult = eventsUpdater([]);
		expect(eventsResult).toHaveLength(SINGLE_EVENT_COUNT);
		const firstEvent = eventsResult[FIRST_CALL_INDEX];
		expect(firstEvent).toBeDefined();
		expect(firstEvent).toMatchObject({
			eventType: "INSERT",
			new: USER_ALICE,
			old: undefined,
		});

		const usersUpdater = getFirstCallArg<UsersUpdater>(setUsers.mock.calls);
		const usersResult = usersUpdater([]);
		expect(usersResult).toStrictEqual([USER_ALICE]);
	});

	it("updates existing user on UPDATE event", () => {
		const setEvents = vi.fn<Dispatch<SetStateAction<RealtimeEvent[]>>>();
		const setUsers = vi.fn<Dispatch<SetStateAction<UserPublic[]>>>();

		handleRealtimeEvent({
			payload: {
				new: { ...USER_ALICE, username: "alice-updated" },
				old: USER_ALICE,
			},
			eventType: "UPDATE",
			setEvents,
			setUsers,
		});

		const usersUpdater = getFirstCallArg<UsersUpdater>(setUsers.mock.calls);
		const usersResult = usersUpdater([USER_ALICE, USER_BOB]);
		expect(usersResult).toHaveLength(PAIR_COUNT);
		const firstUser = usersResult[FIRST_CALL_INDEX];
		expect(firstUser).toBeDefined();
		expect(firstUser).toMatchObject({ user_id: "user-1", username: "alice-updated" });
	});

	it("removes user on DELETE event", () => {
		const setEvents = vi.fn<Dispatch<SetStateAction<RealtimeEvent[]>>>();
		const setUsers = vi.fn<Dispatch<SetStateAction<UserPublic[]>>>();

		handleRealtimeEvent({
			payload: { new: undefined, old: USER_ALICE },
			eventType: "DELETE",
			setEvents,
			setUsers,
		});

		const usersUpdater = getFirstCallArg<UsersUpdater>(setUsers.mock.calls);
		const usersResult = usersUpdater([USER_ALICE, USER_BOB]);
		expect(usersResult).toStrictEqual([USER_BOB]);
	});

	it("ignores invalid payload and leaves users unchanged on INSERT", () => {
		const setUsers = vi.fn<Dispatch<SetStateAction<UserPublic[]>>>();

		handleRealtimeEvent({
			payload: { new: { invalid: "shape" }, old: undefined },
			eventType: "INSERT",
			setEvents: vi.fn<Dispatch<SetStateAction<RealtimeEvent[]>>>(),
			setUsers,
		});

		const usersUpdater = getFirstCallArg<UsersUpdater>(setUsers.mock.calls);
		const usersResult = usersUpdater([USER_ALICE]);
		expect(usersResult).toStrictEqual([USER_ALICE]);
	});
});
