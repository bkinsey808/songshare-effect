import { describe, expect, it } from "vitest";

import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";

import ensureOwnerParticipant from "./ensureOwnerParticipant";

describe("ensureOwnerParticipant", () => {
	it("adds owner when missing from participant list", () => {
		const initialParticipants = [
			{
				event_id: "event-1",
				user_id: "user-1",
				role: "participant",
				status: "joined",
				joined_at: "2026-02-17T00:00:00Z",
			},
		] satisfies readonly EventParticipant[];

		const participants = ensureOwnerParticipant({
			participants: initialParticipants,
			eventId: "event-1",
			ownerId: "owner-1",
			ownerUsername: "owner_name",
			ownerJoinedAt: "2026-02-16T00:00:00Z",
		});

		expect(participants).toContainEqual(
			expect.objectContaining({
				event_id: "event-1",
				user_id: "owner-1",
				role: "owner",
				username: "owner_name",
			}),
		);
	});

	it("normalizes existing owner row role to owner", () => {
		const participants = [
			{
				event_id: "event-2",
				user_id: "owner-2",
				role: "participant",
				status: "joined",
				joined_at: "2026-02-17T00:00:00Z",
			},
		] satisfies readonly EventParticipant[];

		const ensuredParticipants = ensureOwnerParticipant({
			participants,
			eventId: "event-2",
			ownerId: "owner-2",
			ownerUsername: undefined,
			ownerJoinedAt: "2026-02-16T00:00:00Z",
		});

		expect(ensuredParticipants).toContainEqual(
			expect.objectContaining({
				event_id: "event-2",
				user_id: "owner-2",
				role: "owner",
			}),
		);
	});
});
