import { describe, expect, it } from "vitest";

import type { EventEntry } from "@/react/event/event-types";

import forceCast from "@/react/lib/test-utils/forceCast";

import computeEventPermissions from "./computeEventPermissions";

describe("computeEventPermissions", () => {
	it("returns owner permissions when current user is the owner", () => {
		const participants = forceCast<EventEntry["participants"]>([
			{ user_id: "user-1", role: "member" },
			{ user_id: "user-2", role: "event_admin" },
		]);

		const res = computeEventPermissions({
			currentUserId: "owner-id",
			ownerId: "owner-id",
			participants,
		});

		expect(res.isOwner).toBe(true);
		expect(res.isEventAdmin).toBe(false);
		expect(res.canManageEvent).toBe(true);
	});

	it("returns admin permissions when participant has role event_admin", () => {
		const participants = forceCast<EventEntry["participants"]>([
			{ user_id: "user-1", role: "member" },
			{ user_id: "admin-id", role: "event_admin" },
		]);

		const res = computeEventPermissions({
			currentUserId: "admin-id",
			ownerId: "owner-id",
			participants,
		});

		expect(res.isOwner).toBe(false);
		expect(res.isEventAdmin).toBe(true);
		expect(res.canManageEvent).toBe(true);
	});

	it("returns no permissions for unrelated user", () => {
		const participants = forceCast<EventEntry["participants"]>([
			{ user_id: "user-1", role: "member" },
			{ user_id: "user-2", role: "member" },
		]);

		const res = computeEventPermissions({
			currentUserId: "other-id",
			ownerId: "owner-id",
			participants,
		});

		expect(res.isOwner).toBe(false);
		expect(res.isEventAdmin).toBe(false);
		expect(res.canManageEvent).toBe(false);
	});

	it("handles undefined currentUserId gracefully", () => {
		const participants = forceCast<EventEntry["participants"]>([
			{ user_id: "user-1", role: "event_admin" },
		]);

		const res = computeEventPermissions({
			currentUserId: undefined,
			ownerId: "owner-id",
			participants,
		});

		expect(res.isOwner).toBe(false);
		expect(res.isEventAdmin).toBe(false);
		expect(res.canManageEvent).toBe(false);
	});

	it("handles undefined participants gracefully", () => {
		const res = computeEventPermissions({
			currentUserId: "user-1",
			ownerId: "owner-id",
			participants: forceCast<EventEntry["participants"]>(undefined),
		});

		expect(res.isOwner).toBe(false);
		expect(res.isEventAdmin).toBe(false);
		expect(res.canManageEvent).toBe(false);
	});
});
