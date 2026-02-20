import { describe, expect, it } from "vitest";

import parseEventParticipants from "./parseEventParticipants";

describe("parseEventParticipants", () => {
	it("parses participants with legacy username shape", () => {
		const participants = parseEventParticipants(
			[
				{
					event_id: "event-1",
					user_id: "user-1",
					role: "participant",
					joined_at: "2026-02-17T00:00:00Z",
					participant: { username: "legacy_user" },
				},
			],
			"event-1",
		);

		expect(participants).toStrictEqual([
			{
				event_id: "event-1",
				user_id: "user-1",
				role: "participant",
				status: "joined",
				joined_at: "2026-02-17T00:00:00Z",
				participantStatus: "joined",
				username: "legacy_user",
			},
		]);
	});

	it("parses participants with nested user_public username shape", () => {
		const participants = parseEventParticipants(
			[
				{
					event_id: "event-2",
					user_id: "user-2",
					role: "participant",
					joined_at: "2026-02-17T00:00:00Z",
					participant: { user_public: [{ username: "nested_user" }] },
				},
			],
			"event-2",
		);

		expect(participants).toStrictEqual([
			{
				event_id: "event-2",
				user_id: "user-2",
				role: "participant",
				status: "joined",
				joined_at: "2026-02-17T00:00:00Z",
				participantStatus: "joined",
				username: "nested_user",
			},
		]);
	});

	it("parses participants when participant relation is returned as an array", () => {
		const participants = parseEventParticipants(
			[
				{
					event_id: "event-3",
					user_id: "user-3",
					role: "participant",
					joined_at: "2026-02-17T00:00:00Z",
					participant: [{ user_public: { username: "array_user" } }],
				},
			],
			"event-3",
		);

		expect(participants).toStrictEqual([
			{
				event_id: "event-3",
				user_id: "user-3",
				role: "participant",
				status: "joined",
				joined_at: "2026-02-17T00:00:00Z",
				participantStatus: "joined",
				username: "array_user",
			},
		]);
	});
});
