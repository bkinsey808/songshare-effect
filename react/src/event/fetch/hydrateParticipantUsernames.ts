import { Effect } from "effect";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { EventParticipant } from "../event-entry/EventEntry.type";

import { QueryError } from "../event-errors";

const ARRAY_EMPTY = 0;

/**
 * Loads participant usernames from user_public for participants that do not already have one.
 *
 * @param client - Supabase client used for lookup
 * @param participants - Parsed participant rows for the current event
 * @returns Participants with usernames merged when available
 */
export default function hydrateParticipantUsernames(
	client: SupabaseClientLike,
	participants: readonly EventParticipant[],
): Effect.Effect<readonly EventParticipant[], QueryError> {
	if (participants.length === ARRAY_EMPTY) {
		return Effect.succeed(participants);
	}

	const missingUsernameUserIds = [
		...new Set(
			participants
				.filter((participant) => participant.username === undefined)
				.map((participant) => participant.user_id),
		),
	];

	if (missingUsernameUserIds.length === ARRAY_EMPTY) {
		return Effect.succeed(participants);
	}

	return Effect.gen(function* hydrateParticipantUsernamesGen($) {
		const rawUserResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "user_public", {
						cols: "user_id, username",
						in: { col: "user_id", vals: missingUsernameUserIds },
					}),
				catch: (err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					return new QueryError("Failed to query user_public", errorMessage);
				},
			}),
		);

		const userData = Array.isArray(rawUserResult["data"]) ? rawUserResult["data"] : [];
		const usernameByUserId = new Map(
			userData
				.filter(
					(row: unknown): row is { user_id: string; username: string } =>
						isRecord(row) &&
						typeof row["user_id"] === "string" &&
						typeof row["username"] === "string" &&
						row["username"] !== "",
				)
				.map((row) => [row.user_id, row.username] as const),
		);

		return participants.map((participant) => {
			if (participant.username !== undefined) {
				return participant;
			}

			const resolvedUsername = usernameByUserId.get(participant.user_id);
			if (resolvedUsername === undefined) {
				return participant;
			}

			return { ...participant, username: resolvedUsername };
		});
	});
}
