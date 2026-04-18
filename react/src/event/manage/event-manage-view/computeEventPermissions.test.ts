import { describe, expect, it } from "vitest";

import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";
import type { EventEntry } from "@/react/event/event-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import computeEventPermissions from "./computeEventPermissions";

const OWNER_ID = "owner-1";
const ADMIN_ID = "admin-1";
const OTHER_ID = "other-1";

/**
 * Create a test participant entry.
 *
 * @param user_id - Participant user id.
 * @param role - Participant role string.
 * @param username - Optional participant username.
 * @returns EventParticipant test fixture.
 */
function makeParticipant(opts: {
	user_id: string;
	role: string;
	username?: string;
}): EventParticipant {
	return forceCast({
		user_id: opts.user_id,
		role: opts.role,
		username: opts.username,
		event_id: "e1",
		joined_at: "2026-01-01T00:00:00Z",
		status: "joined",
	});
}

describe("computeEventPermissions", () => {
	it("isOwner is true when currentUserId matches ownerId", () => {
		const result = computeEventPermissions({
			currentUserId: OWNER_ID,
			ownerId: OWNER_ID,
			participants: [],
		});
		expect(result.isOwner).toBe(true);
		expect(result.canManageEvent).toBe(true);
	});

	it("isOwner is false when currentUserId differs from ownerId", () => {
		const result = computeEventPermissions({
			currentUserId: OTHER_ID,
			ownerId: OWNER_ID,
			participants: [],
		});
		expect(result.isOwner).toBe(false);
	});

	it("isEventAdmin is true when participant has event_admin role", () => {
		const participants: EventEntry["participants"] = [
			makeParticipant({ user_id: ADMIN_ID, role: "event_admin", username: "admin" }),
		];
		const result = computeEventPermissions({
			currentUserId: ADMIN_ID,
			ownerId: OWNER_ID,
			participants,
		});
		expect(result.isEventAdmin).toBe(true);
		expect(result.canManageEvent).toBe(true);
	});

	it("canManageEvent is false when not owner and not admin", () => {
		const participants: EventEntry["participants"] = [
			makeParticipant({ user_id: OTHER_ID, role: "participant", username: "user" }),
		];
		const result = computeEventPermissions({
			currentUserId: OTHER_ID,
			ownerId: OWNER_ID,
			participants,
		});
		expect(result.isOwner).toBe(false);
		expect(result.isEventAdmin).toBe(false);
		expect(result.canManageEvent).toBe(false);
	});

	it("returns canManageEvent false when currentUserId is undefined", () => {
		const result = computeEventPermissions({
			currentUserId: undefined,
			ownerId: OWNER_ID,
			participants: [],
		});
		expect(result.isOwner).toBe(false);
		expect(result.canManageEvent).toBe(false);
	});
});
