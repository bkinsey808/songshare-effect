import { describe, expect, it } from "vitest";

import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";

import {
	deriveCurrentParticipantStatus,
	getParticipantPermissions,
	transitionParticipantStatus,
} from "./participantStatusMachine";

describe("participantStatusMachine", () => {
	it("keeps kicked as terminal for join attempts", () => {
		expect(transitionParticipantStatus("kicked", "join")).toBe("kicked");
	});

	it("allows invited users to join and maps leave to left", () => {
		expect(transitionParticipantStatus("invited", "join")).toBe("joined");
		expect(transitionParticipantStatus("joined", "leave")).toBe("left");
		expect(transitionParticipantStatus("left", "join")).toBe("joined");
	});

	it("exposes permission matrix with joined-only full access", () => {
		expect(getParticipantPermissions("joined")).toStrictEqual({
			canViewFullEvent: true,
			canViewSlides: true,
			canJoin: false,
			canLeave: true,
		});
		expect(getParticipantPermissions("invited")).toStrictEqual({
			canViewFullEvent: false,
			canViewSlides: false,
			canJoin: true,
			canLeave: false,
		});
		expect(getParticipantPermissions("left")).toStrictEqual({
			canViewFullEvent: false,
			canViewSlides: false,
			canJoin: true,
			canLeave: false,
		});
		expect(getParticipantPermissions("kicked")).toStrictEqual({
			canViewFullEvent: false,
			canViewSlides: false,
			canJoin: false,
			canLeave: false,
		});
	});

	it("derives joined for owner and invited when missing participant row", () => {
		const participants = [
			{
				event_id: "e1",
				user_id: "participant-1",
				role: "participant",
				status: "joined",
				joined_at: "2026-01-01T00:00:00Z",
			},
		] satisfies readonly EventParticipant[];

		const event = makeEventEntry({
			owner_id: "owner-1",
			participants,
		});

		expect(deriveCurrentParticipantStatus(event, "owner-1")).toBe("joined");
		expect(deriveCurrentParticipantStatus(event, "invited-1")).toBe("invited");
	});
});
