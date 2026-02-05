import type { Dispatch, SetStateAction } from "react";

import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";

import { type UserPublic, isUserPublic } from "./isUserPublic";

type RealtimeEvent = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new: UserPublic | undefined;
	old: UserPublic | undefined;
	timestamp: string;
};

type SetEvents = Dispatch<SetStateAction<RealtimeEvent[]>>;
type SetUsers = Dispatch<SetStateAction<UserPublic[]>>;

const EVENTS_MAX = 10;

/**
 * Top-level helper so the main component function stays under the max-lines
 * limit enforced by the linter.
 */
function handleRealtimeEvent({
	payload,
	eventType,
	setEvents,
	setUsers,
}: {
	payload: unknown;
	eventType: "INSERT" | "UPDATE" | "DELETE";
	setEvents: SetEvents;
	setUsers: SetUsers;
}): void {
	// The Supabase realtime payload is untyped here, so treat it as unknown and
	// guard before reading the `new` and `old` fields.
	let newRaw: unknown = undefined;
	let oldRaw: unknown = undefined;

	if (isRecord(payload)) {
		newRaw = payload["new"];
		oldRaw = payload["old"];
	}
	const realtimeEvent: RealtimeEvent = {
		eventType,
		new: isUserPublic(newRaw) ? newRaw : undefined,
		old: isUserPublic(oldRaw) ? oldRaw : undefined,
		timestamp: new Date().toISOString(),
	};

	// Add to events log
	setEvents((prev) => [realtimeEvent, ...prev].slice(ZERO, EVENTS_MAX));

	// Update users list
	setUsers((prevUsers) => {
		switch (eventType) {
			case "INSERT": {
				if (realtimeEvent.new !== undefined) {
					const newUser = realtimeEvent.new;
					// oxlint-disable-next-line unicorn/no-array-sort
					return [...prevUsers, newUser].sort((userA, userB) =>
						userA.username.localeCompare(userB.username),
					);
				}
				break;
			}
			case "UPDATE": {
				if (realtimeEvent.new !== undefined) {
					const updatedUser = realtimeEvent.new;
					return (
						prevUsers
							.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
							// oxlint-disable-next-line unicorn/no-array-sort
							.sort((userA, userB) => userA.username.localeCompare(userB.username))
					);
				}
				break;
			}
			case "DELETE": {
				if (realtimeEvent.old !== undefined) {
					const deletedUser = realtimeEvent.old;
					return prevUsers.filter((user) => user.user_id !== deletedUser.user_id);
				}
				break;
			}
		}
		return prevUsers;
	});
}

export { handleRealtimeEvent, type RealtimeEvent };
