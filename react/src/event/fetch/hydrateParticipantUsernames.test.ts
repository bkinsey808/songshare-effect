import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { EventParticipant } from "../event-entry/EventEntry.type";

import hydrateParticipantUsernames from "./hydrateParticipantUsernames";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

function makeParticipant(overrides: Partial<EventParticipant>): EventParticipant {
	return {
		event_id: overrides.event_id ?? "event-1",
		user_id: overrides.user_id ?? "user-1",
		role: overrides.role ?? "participant",
		joined_at: overrides.joined_at ?? "2026-02-17T00:00:00Z",
		status: overrides.status ?? "joined",
		...(overrides.username === undefined ? {} : { username: overrides.username }),
		...(overrides.participantStatus === undefined
			? {}
			: { participantStatus: overrides.participantStatus }),
	};
}

describe("hydrateParticipantUsernames", () => {
	it("returns input unchanged when participant list is empty", async () => {
		vi.resetAllMocks();
		const client = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
		const participants: readonly EventParticipant[] = [];

		const result = await Effect.runPromise(hydrateParticipantUsernames(client, participants));

		expect(result).toStrictEqual([]);
		expect(vi.mocked(callSelect)).not.toHaveBeenCalled();
	});

	it("returns input unchanged when all participants already have usernames", async () => {
		vi.resetAllMocks();
		const client = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
		const participants: readonly EventParticipant[] = [
			makeParticipant({ user_id: "user-1", username: "user_one" }),
			makeParticipant({ user_id: "user-2", username: "user_two" }),
		];

		const result = await Effect.runPromise(hydrateParticipantUsernames(client, participants));

		expect(result).toStrictEqual(participants);
		expect(vi.mocked(callSelect)).not.toHaveBeenCalled();
	});

	it("hydrates only participants missing usernames", async () => {
		vi.resetAllMocks();
		const client = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
		const participants: readonly EventParticipant[] = [
			makeParticipant({ user_id: "user-1", username: "user_one" }),
			makeParticipant({ user_id: "user-2" }),
			makeParticipant({ user_id: "user-3" }),
		];
		vi.mocked(callSelect).mockResolvedValue({
			data: [
				{ user_id: "user-2", username: "user_two" },
				{ user_id: "user-3", username: "user_three" },
			],
		});

		const result = await Effect.runPromise(hydrateParticipantUsernames(client, participants));

		expect(vi.mocked(callSelect)).toHaveBeenCalledWith(client, "user_public", {
			cols: "user_id, username",
			in: { col: "user_id", vals: ["user-2", "user-3"] },
		});
		expect(result).toStrictEqual([
			makeParticipant({ user_id: "user-1", username: "user_one" }),
			makeParticipant({ user_id: "user-2", username: "user_two" }),
			makeParticipant({ user_id: "user-3", username: "user_three" }),
		]);
	});

	it("queries unique user ids and keeps participant unchanged when username not found", async () => {
		vi.resetAllMocks();
		const client = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
		const participants: readonly EventParticipant[] = [
			makeParticipant({ user_id: "user-2" }),
			makeParticipant({ user_id: "user-2" }),
			makeParticipant({ user_id: "user-4" }),
		];
		vi.mocked(callSelect).mockResolvedValue({
			data: [{ user_id: "user-2", username: "user_two" }],
		});

		const result = await Effect.runPromise(hydrateParticipantUsernames(client, participants));

		expect(vi.mocked(callSelect)).toHaveBeenCalledWith(client, "user_public", {
			cols: "user_id, username",
			in: { col: "user_id", vals: ["user-2", "user-4"] },
		});
		expect(result).toStrictEqual([
			makeParticipant({ user_id: "user-2", username: "user_two" }),
			makeParticipant({ user_id: "user-2", username: "user_two" }),
			makeParticipant({ user_id: "user-4" }),
		]);
	});

	it("fails with mapped QueryError when user_public query fails", async () => {
		vi.resetAllMocks();
		const client = forceCast<SupabaseClientLike>(createMinimalSupabaseClient());
		const participants: readonly EventParticipant[] = [makeParticipant({ user_id: "user-5" })];
		vi.mocked(callSelect).mockRejectedValue(new Error("network down"));

		await expect(
			Effect.runPromise(hydrateParticipantUsernames(client, participants)),
		).rejects.toThrow(/Failed to query user_public/);
	});
});
